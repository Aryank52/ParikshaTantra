import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditLedgerService } from '../services/auditLedgerService';

const router = Router();
const prisma = new PrismaClient();

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
  const centre = await prisma.examCentre.findUnique({
    where: { id },
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
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'CENTRE_ADMIN', 'INVIGILATOR', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { centreId, examId, activationToken } = req.body;

    if (!centreId || !examId || !activationToken) {
      return res.status(400).json({ error: 'Missing required activation parameter (centreId, examId, activationToken).' });
    }

    const centre = await prisma.examCentre.findUnique({ where: { id: centreId as string } });
    if (!centre) return res.status(404).json({ error: 'Exam centre not found' });

    const exam = await prisma.exam.findUnique({ where: { id: examId as string } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (exam.status !== 'RELEASED' && exam.status !== 'RUNNING') {
      return res.status(400).json({
        error: 'EXAM_NOT_RELEASED',
        message: 'Centre activation rejected: The central authority has not executed GLOBAL EXAM RELEASE yet.',
      });
    }

    const activationRecord = await prisma.centreActivation.findFirst({
      where: {
        examId: examId as string,
        centreId: centreId as string,
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
      where: { id: centreId as string },
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
      metadata: { centreId, examId, activationToken },
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

    const device = await prisma.registeredDevice.upsert({
      where: { deviceId: deviceId as string },
      update: {
        lastHeartbeat: new Date(),
        ipAddress: getClientIp(req),
      },
      create: {
        deviceId: deviceId as string,
        centreId: centreId as string,
        serialNumber: serialNumber || `DEV-SN-${Math.floor(1000 + Math.random() * 9000)}`,
        ipAddress: getClientIp(req),
        hardwareHash: hardwareHash || 'HW-HASH-GENERIC',
        status: 'AUTHORIZED',
      },
    });

    return res.json(device);
  }
);

export default router;
