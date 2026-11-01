import { Router, Response } from 'express';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { activationRateLimiter } from '../middleware/rateLimitMiddleware';
import { AuditLedgerService } from '../services/auditLedgerService';
import { CentreReadinessService } from '../services/centreReadinessService';
import { prisma } from '../lib/prisma';

const router = Router();

const getClientIp = (req: any): string => {
  if (typeof req.ip === 'string') return req.ip;
  if (Array.isArray(req.ip)) return req.ip[0];
  return '127.0.0.1';
};

// GET /api/centres - List all registered exam centres
router.get('/', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const centres = await prisma.examCentre.findMany({
    include: {
      devices: true,
      _count: { select: { candidates: true, candidateSessions: true } },
    },
  });
  return res.json(centres);
});

// GET /api/centres/:id - Centre detail with devices & active candidate sessions
router.get('/:id', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const centre = await prisma.examCentre.findFirst({
    where: {
      OR: [
        { id },
        { centreCode: id },
      ],
    },
    include: {
      devices: true,
      candidates: true,
      candidateSessions: { include: { candidate: true, device: true } },
      activations: { include: { exam: true } },
    },
  });

  if (!centre) return res.status(404).json({ error: 'Centre not found' });
  return res.json(centre);
});

// POST /api/centres/activate - Secure Centre Gateway Activation Workflow
router.post(
  '/activate',
  activationRateLimiter,
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'CENTRE_ADMIN', 'INVIGILATOR', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { centreId, examId, activationToken } = req.body;

    if (!centreId || !examId || !activationToken) {
      return res.status(400).json({ error: 'Missing required activation parameter (centreId, examId, activationToken).' });
    }

    const centre = await prisma.examCentre.findFirst({
      where: { OR: [{ id: centreId as string }, { centreCode: centreId as string }] },
    });
    if (!centre) return res.status(404).json({ error: 'Exam centre not found' });

    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id: examId as string }, { examCode: examId as string }] },
    });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (exam.status !== 'RELEASED' && exam.status !== 'RUNNING') {
      return res.status(400).json({
        error: 'EXAM_NOT_RELEASED',
        message: 'Centre activation rejected: The central authority has not executed GLOBAL EXAM RELEASE yet.',
      });
    }

    const activationRecord = await prisma.centreActivation.findFirst({
      where: {
        examId: exam.id,
        centreId: centre.id,
        activationToken: (activationToken as string).trim().toUpperCase(),
        isValid: true,
      },
    });

    if (!activationRecord) {
      await AuditLedgerService.logEvent({
        eventType: 'INVALID_ACTIVATION_TOKEN_ATTEMPT',
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: `REJECTED activation attempt for Centre ${centre.centreCode} using invalid/expired token ${activationToken}`,
        ipAddress: getClientIp(req),
      });

      return res.status(401).json({
        error: 'INVALID_ACTIVATION_TOKEN',
        message: 'Security Violation: Provided activation token is cryptographically invalid, bound to another centre, or corrupted.',
      });
    }

    if (new Date() > new Date(activationRecord.expiresAt)) {
      return res.status(401).json({
        error: 'ACTIVATION_TOKEN_EXPIRED',
        message: 'Security Violation: Activation token has passed its 15-minute validity window. Request fresh token from Central Authority.',
      });
    }

    await prisma.centreActivation.update({
      where: { id: activationRecord.id },
      data: { usedAt: new Date() },
    });

    const updatedCentre = await prisma.examCentre.update({
      where: { id: centre.id },
      data: {
        status: 'ACTIVATED',
        connectivityStatus: 'ONLINE',
      },
    });

    await AuditLedgerService.logEvent({
      eventType: 'CENTRE_GATEWAY_ACTIVATED',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `Centre Gateway ${centre.name} (${centre.centreCode}) ACTIVATED for Exam ${exam.examCode}. Candidate CBT sync enabled.`,
      ipAddress: getClientIp(req),
      metadata: { centreId: centre.id, examId: exam.id, activationToken },
    });

    return res.json({
      message: `Centre ${centre.name} Gateway successfully ACTIVATED! Terminals now synchronized for CBT release.`,
      centre: updatedCentre,
    });
  }
);

// POST /api/centres/register-device - Register / Heartbeat Exam Terminal Device
router.post(
  '/register-device',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'CENTRE_ADMIN', 'INVIGILATOR', 'SECURITY_OFFICER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { deviceId, centreId, serialNumber, hardwareHash } = req.body;

    if (!deviceId || !centreId) {
      return res.status(400).json({ error: 'Missing deviceId or centreId' });
    }

    const targetCentre = await prisma.examCentre.findFirst({
      where: { OR: [{ id: centreId as string }, { centreCode: centreId as string }] },
    });
    if (!targetCentre) return res.status(404).json({ error: 'Exam centre not found' });

    const device = await prisma.registeredDevice.upsert({
      where: { deviceId: deviceId as string },
      update: {
        lastHeartbeat: new Date(),
        ipAddress: getClientIp(req),
      },
      create: {
        deviceId: deviceId as string,
        centreId: targetCentre.id,
        serialNumber: serialNumber || `DEV-SN-${Math.floor(1000 + Math.random() * 9000)}`,
        ipAddress: getClientIp(req),
        hardwareHash: hardwareHash || 'HW-HASH-GENERIC',
        status: 'AUTHORIZED',
      },
    });

    return res.json(device);
  }
);

// GET /api/centres/:id/readiness - Run automated centre readiness evaluation
router.get('/:id/readiness', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const examId = req.query.examId as string | undefined;
  try {
    const report = await CentreReadinessService.evaluateReadiness(id, examId);
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Readiness evaluation failed' });
  }
});

// GET /api/centres/:id/readiness/checklist - Retrieve structured operational readiness checklist
router.get('/:id/readiness/checklist', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const examId = req.query.examId as string | undefined;
  try {
    const report = await CentreReadinessService.evaluateReadiness(id, examId);
    return res.json({
      centreId: report.centreId,
      centreCode: report.centreCode,
      status: report.status,
      scorePercentage: report.scorePercentage,
      reasons: report.reasons,
      checklist: report.checklist,
      deviceSummary: report.deviceSummary,
      capacitySummary: report.capacitySummary,
      activationSummary: report.activationSummary,
      hasOverride: report.hasOverride,
      overrideDetails: report.overrideDetails,
      evaluatedAt: report.evaluatedAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve readiness checklist' });
  }
});

// POST /api/centres/:id/readiness/evaluate - Force re-evaluation & broadcast live update
router.post(
  '/:id/readiness/evaluate',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'EXAM_CONTROLLER', 'CENTRE_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const { examId } = req.body;
    try {
      const report = await CentreReadinessService.evaluateReadiness(id, examId);

      const { WebSocketService } = require('../services/websocketService');
      WebSocketService.broadcastCentreReadiness(report.centreId, report.centreCode, report.state, {
        status: report.status,
        scorePercentage: report.scorePercentage,
        reasons: report.reasons,
      });

      return res.json({
        success: true,
        message: `Readiness evaluation completed for ${report.centreName} (${report.centreCode}): ${report.status}`,
        report,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Re-evaluation failed' });
    }
  }
);

// POST /api/centres/:id/readiness/override - Authorized operational override recording
router.post(
  '/:id/readiness/override',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const { examId, reason } = req.body;
    try {
      const user = req.user!;
      const updatedReport = await CentreReadinessService.recordOverride({
        centreId: id,
        examId,
        actorId: user.userId,
        actorRole: user.role,
        reason,
        ipAddress: getClientIp(req),
      });

      return res.json({
        success: true,
        message: `Operational override approved for Centre ${updatedReport.centreCode}. Readiness status updated to ${updatedReport.status}.`,
        report: updatedReport,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Override execution failed' });
    }
  }
);

// GET /api/centres/:id/devices - Retrieve devices registered at this centre with hardware check logs
router.get(
  '/:id/devices',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'DISTRICT_AUTHORITY', 'EXAM_CONTROLLER', 'CENTRE_ADMIN', 'INVIGILATOR'),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    try {
      const centre = await prisma.examCentre.findFirst({
        where: { OR: [{ id }, { centreCode: id }] },
        include: {
          devices: {
            include: {
              candidateSessions: {
                where: { status: { in: ['LOBBY', 'IN_PROGRESS', 'PAUSED'] } },
                select: { id: true, sessionToken: true, status: true, candidate: { select: { fullName: true, candidateCode: true } } },
                take: 1,
              },
            },
          },
        },
      });

      if (!centre) return res.status(404).json({ error: 'Centre not found' });

      const deviceIds = centre.devices.map((d) => d.deviceId);
      const hardwareLogs = await prisma.hardwareCheckLog.findMany({
        where: { entityId: { in: deviceIds } },
        orderBy: { createdAt: 'desc' },
        take: deviceIds.length * 2,
      });

      const devicesWithDiagnostics = centre.devices.map((dev) => {
        const latestLog = hardwareLogs.find((l) => l.entityId === dev.deviceId);
        return {
          id: dev.id,
          deviceId: dev.deviceId,
          serialNumber: dev.serialNumber,
          ipAddress: dev.ipAddress,
          hardwareHash: dev.hardwareHash,
          status: dev.status,
          lastHeartbeat: dev.lastHeartbeat,
          createdAt: dev.createdAt,
          activeSession: dev.candidateSessions[0] || null,
          diagnostics: {
            cameraStatus: latestLog?.cameraStatus || 'PASS',
            micStatus: latestLog?.micStatus || 'PASS',
            screenRes: latestLog?.screenRes || '1920x1080',
            networkLatencyMs: latestLog?.networkLatencyMs ?? 20,
            overallStatus: latestLog?.overallStatus || (dev.status === 'AUTHORIZED' ? 'PASS' : 'WARNING'),
          },
        };
      });

      return res.json({
        centreId: centre.id,
        centreCode: centre.centreCode,
        centreName: centre.name,
        totalDevices: centre.devices.length,
        devices: devicesWithDiagnostics,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve centre devices' });
    }
  }
);

export default router;
