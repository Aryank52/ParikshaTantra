import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';
import { WebSocketService } from '../services/websocketService';
import { CONFIG } from '../config';

const router = Router();
const prisma = new PrismaClient();

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
  const exam = await prisma.exam.findUnique({
    where: { id },
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

    const exam = await prisma.exam.findUnique({
      where: { id: examId as string },
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
      where: { id: examId as string },
      data: {
        status: 'RELEASED',
        globalReleaseToken: releaseToken,
        releasedAt,
      },
    });

    const centres = await prisma.examCentre.findMany();
    const timeWindow = Math.floor(releasedAt.getTime() / (CONFIG.ACTIVATION_TOKEN_EXPIRY_MINUTES * 60 * 1000));
    const expiresAt = new Date(releasedAt.getTime() + CONFIG.ACTIVATION_TOKEN_EXPIRY_MINUTES * 60000);

    const generatedActivations = [];

    for (const centre of centres) {
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

    const { ExamLifecycleService } = await import('../services/examLifecycleService.js');
    const result = await ExamLifecycleService.transitionState({
      examId,
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

export default router;

