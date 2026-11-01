import { Router, Response } from 'express';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';
import { WebSocketService } from '../services/websocketService';
import { ExamLifecycleService } from '../services/examLifecycleService';
import { CONFIG } from '../config';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/exams - List exams
router.get('/', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const exams = await prisma.exam.findMany({
    include: {
      organization: { select: { name: true, code: true } },
      blueprint: true,
      _count: { select: { candidateSessions: true, activations: true } },
    },
    orderBy: { scheduledStart: 'desc' },
  });
  return res.json(exams);
});

// GET /api/exams/:id - Exam detail
router.get('/:id', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const exam = await prisma.exam.findFirst({
    where: {
      OR: [
        { id },
        { examCode: id },
      ],
    },
    include: {
      organization: true,
      blueprint: true,
      activations: { include: { centre: true } },
    },
  });
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  return res.json(exam);
});

// POST /api/exams/create - Schedule new exam
router.post(
  '/create',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, organizationId, scheduledStart, durationMinutes, totalMarks } = req.body;

    const examCode = `EXAM-${Math.floor(1000 + Math.random() * 9000)}`;
    const start = scheduledStart ? new Date(scheduledStart) : new Date();
    const end = new Date(start.getTime() + (durationMinutes || 180) * 60000);

    const exam = await prisma.exam.create({
      data: {
        examCode,
        title,
        description,
        organizationId: (organizationId || req.user?.organizationId || (await prisma.organization.findFirst())?.id || '') as string,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: durationMinutes || 180,
        totalMarks: totalMarks || 100.0,
        status: 'SCHEDULED',
      },
    });

    await AuditLedgerService.logEvent({
      eventType: 'EXAM_SCHEDULED',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `Scheduled Exam ${exam.examCode} (${exam.title})`,
      metadata: { examId: exam.id, scheduledStart: start },
    });

    return res.status(201).json(exam);
  }
);

// POST /api/exams/global-release - GLOBAL EXAM RELEASE (CORE FEATURE)
router.post(
  '/global-release',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { examId } = req.body;

    if (!examId) return res.status(400).json({ error: 'Missing examId' });

    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id: examId as string }, { examCode: examId as string }] },
      include: { blueprint: true },
    });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (!exam.blueprint) {
      return res.status(400).json({
        error: 'BLUEPRINT_MISSING',
        message: 'Cannot release exam: Exam Blueprint has not been generated and cryptographically signed yet.',
      });
    }

    const releaseToken = `REL-GLOBAL-${CryptoService.hashContent(`${exam.id}:${Date.now()}`).substring(0, 12).toUpperCase()}`;
    const releasedAt = new Date();

    const updatedExam = await prisma.exam.update({
      where: { id: exam.id },
      data: {
        status: 'RELEASED',
        globalReleaseToken: releaseToken,
        releasedAt,
      },
    });

    const centres = await prisma.examCentre.findMany();
    const timeWindow = Math.floor(releasedAt.getTime() / (CONFIG.ACTIVATION_TOKEN_EXPIRY_MINUTES * 60 * 1000));
    const expiresAt = new Date(releasedAt.getTime() + CONFIG.ACTIVATION_TOKEN_EXPIRY_MINUTES * 60000);

    const generatedActivations: any[] = [];

    for (const centre of centres) {
      // Invalidate existing valid activations for this exam/centre to respect partial unique constraint
      await prisma.centreActivation.updateMany({
        where: { examId: exam.id, centreId: centre.id, isValid: true },
        data: { isValid: false },
      });

      const derivedToken = CryptoService.generateActivationToken(
        exam.id,
        exam.examCode,
        centre.id,
        centre.centreCode,
        timeWindow
      );

      await prisma.centreActivation.create({
        data: {
          examId: exam.id,
          centreId: centre.id,
          activationToken: derivedToken,
          expiresAt,
        },
      });

      generatedActivations.push({
        centreCode: centre.centreCode,
        centreName: centre.name,
        activationToken: derivedToken,
        expiresAt,
      });
    }

    await AuditLedgerService.logEvent({
      eventType: 'GLOBAL_EXAM_RELEASE',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `EXECUTED GLOBAL EXAM RELEASE for Exam ${exam.examCode}. Short-lived Centre Activation Tokens derived for ${centres.length} centres.`,
      metadata: { examId: exam.id, globalReleaseToken: releaseToken, totalCentres: centres.length },
    });

    WebSocketService.broadcast({
      type: 'EXAM_RELEASED',
      payload: {
        examId: exam.id,
        examCode: exam.examCode,
        title: exam.title,
        globalReleaseToken: releaseToken,
        expiresAt,
        message: 'CRITICAL SECURITY EVENT: National Examination Global Release Initiated.',
      },
    });

    return res.json({
      message: 'GLOBAL EXAM RELEASE SUCCESSFUL! Real-time notifications dispatched to all registered exam centres.',
      exam: updatedExam,
      centreActivations: generatedActivations,
    });
  }
);

// POST /api/exams/:id/transition - Transition operational lifecycle state
router.post(
  '/:id/transition',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'SECURITY_OFFICER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const examId = req.params.id as string;
    const { targetState, reason } = req.body;

    if (!targetState) {
      return res.status(400).json({ error: 'Missing targetState parameter' });
    }

    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id: examId }, { examCode: examId }] },
    });
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const result = await ExamLifecycleService.transitionState({
      examId: exam.id,
      targetState,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
      reason,
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'TRANSITION_DENIED',
        message: result.message,
        violations: result.violations,
      });
    }

    return res.json(result);
  }
);

// GET /api/exams/:id/centres - List centres activated or allocated for this exam with readiness status
router.get(
  '/:id/centres',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'EXAM_CONTROLLER', 'AUDITOR'),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    try {
      const exam = await prisma.exam.findFirst({
        where: { OR: [{ id }, { examCode: id }] },
      });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      // Find all activations for this exam
      const activations = await prisma.centreActivation.findMany({
        where: { examId: exam.id, isValid: true },
        include: {
          centre: {
            include: {
              devices: true,
              candidateSessions: { where: { examId: exam.id } },
            },
          },
        },
      });

      // Find all centres in system if none activated yet
      let centresList: any[] = [];
      if (activations.length > 0) {
        centresList = activations.map((a) => ({
          activationId: a.id,
          activationToken: a.activationToken,
          expiresAt: a.expiresAt,
          usedAt: a.usedAt,
          centre: a.centre,
        }));
      } else {
        const allCentres = await prisma.examCentre.findMany({
          include: { devices: true, candidateSessions: { where: { examId: exam.id } } },
        });
        centresList = allCentres.map((c) => ({
          activationId: null,
          activationToken: null,
          expiresAt: null,
          usedAt: null,
          centre: c,
        }));
      }

      return res.json({
        examId: exam.id,
        examCode: exam.examCode,
        title: exam.title,
        status: exam.status,
        totalCentres: centresList.length,
        centres: centresList,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve exam centres' });
    }
  }
);

// GET /api/exams/:id/devices - List devices authorized across centres for this exam
router.get(
  '/:id/devices',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'EXAM_CONTROLLER', 'AUDITOR'),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    try {
      const exam = await prisma.exam.findFirst({
        where: { OR: [{ id }, { examCode: id }] },
      });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      const devices = await prisma.registeredDevice.findMany({
        include: {
          centre: {
            select: { id: true, centreCode: true, name: true, state: true, district: true },
          },
          candidateSessions: {
            where: { examId: exam.id },
            select: { id: true, sessionToken: true, status: true, candidate: { select: { fullName: true, candidateCode: true } } },
            take: 1,
          },
        },
        orderBy: [{ centre: { centreCode: 'asc' } }, { deviceId: 'asc' }],
      });

      return res.json({
        examId: exam.id,
        examCode: exam.examCode,
        totalDevices: devices.length,
        devices,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve exam devices' });
    }
  }
);

export default router;
