import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditLedgerService } from '../services/auditLedgerService';
import { WebSocketService } from '../services/websocketService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/soc/dashboard - SOC High-Density Operations & Metrics Summary
router.get(
  '/dashboard',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'SECURITY_OFFICER', 'AUDITOR', 'EXAM_CONTROLLER'),
  async (_req, res: Response) => {
    const activeExams = await prisma.exam.count({ where: { status: { in: ['RELEASED', 'RUNNING'] } } });
    const totalCentres = await prisma.examCentre.count();
    const activeCandidates = await prisma.candidateSession.count({ where: { status: 'IN_PROGRESS' } });
    const activeDevices = await prisma.registeredDevice.count({ where: { status: 'AUTHORIZED' } });

    const securityEvents = await prisma.securityEvent.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { centre: { select: { name: true, centreCode: true } } },
    });

    const centres = await prisma.examCentre.findMany({
      select: {
        id: true,
        centreCode: true,
        name: true,
        state: true,
        district: true,
        geolocation: true,
        capacity: true,
        status: true,
        connectivityStatus: true,
        securityStatus: true,
      },
    });

    return res.json({
      summary: {
        activeExams,
        totalCentres,
        activeCandidates,
        activeDevices,
      },
      centres,
      recentEvents: securityEvents,
    });
  }
);

// POST /api/soc/emergency-freeze - Emergency Global / Centre / Device / Session Freeze Endpoint
router.post(
  '/emergency-freeze',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'SECURITY_OFFICER', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { scope, examId, centreId, deviceId, candidateId, reason } = req.body;
    // scope: 'GLOBAL' | 'CENTRE' | 'DEVICE' | 'SESSION'

    if (!scope || !reason) {
      return res.status(400).json({ error: 'Missing freeze scope or reason' });
    }

    let affectedCount = 0;

    if (scope === 'GLOBAL' && examId) {
      // Freeze Central Exam
      await prisma.exam.update({
        where: { id: examId },
        data: { status: 'FROZEN' },
      });

      // Freeze all active candidate sessions for this exam
      const sessions = await prisma.candidateSession.updateMany({
        where: { examId, status: { in: ['LOBBY', 'IN_PROGRESS'] } },
        data: { status: 'FROZEN' },
      });
      affectedCount = sessions.count;

      WebSocketService.broadcast({
        type: 'EXAM_FROZEN',
        payload: {
          scope: 'GLOBAL',
          examId,
          reason,
          message: 'CRITICAL ALERT: Examination FROZEN by Security Operations Centre.',
        },
      });
    } else if (scope === 'CENTRE' && centreId) {
      // Freeze specific Centre Gateway
      await prisma.examCentre.update({
        where: { id: centreId },
        data: { securityStatus: 'RED', status: 'AUDIT' },
      });

      const sessions = await prisma.candidateSession.updateMany({
        where: { centreId, status: { in: ['LOBBY', 'IN_PROGRESS'] } },
        data: { status: 'FROZEN' },
      });
      affectedCount = sessions.count;

      WebSocketService.broadcast({
        type: 'EXAM_FROZEN',
        targetCentreId: centreId,
        payload: {
          scope: 'CENTRE',
          centreId,
          reason,
          message: 'CRITICAL ALERT: Centre Gateway FROZEN by Security Officer.',
        },
      });
    } else if (scope === 'DEVICE' && deviceId) {
      // Block specific device
      await prisma.registeredDevice.update({
        where: { deviceId },
        data: { status: 'BLOCKED' },
      });
      affectedCount = 1;
    } else if (scope === 'SESSION' && candidateId) {
      // Freeze specific candidate session
      const sessions = await prisma.candidateSession.updateMany({
        where: { candidateId, status: { in: ['LOBBY', 'IN_PROGRESS'] } },
        data: { status: 'FROZEN' },
      });
      affectedCount = sessions.count;
    }

    // Record Security Event & Immutable Audit Event
    await prisma.securityEvent.create({
      data: {
        eventType: `EMERGENCY_FREEZE_${scope}`,
        severity: 'CRITICAL',
        centreId: centreId || null,
        candidateId: candidateId || null,
        deviceId: deviceId || null,
        riskScore: 100.0,
        detailsJson: JSON.stringify({ scope, reason, affectedCount, executedBy: req.user?.username }),
        status: 'FROZEN',
      },
    });

    await AuditLedgerService.logEvent({
      eventType: `EMERGENCY_FREEZE_${scope}`,
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `EXECUTED EMERGENCY FREEZE [Scope: ${scope}]. Reason: ${reason}. Affected Sessions: ${affectedCount}`,
      metadata: { scope, examId, centreId, deviceId, candidateId, reason },
    });

    return res.json({
      message: `EMERGENCY FREEZE EXECUTED SUCCESSFULLY [Scope: ${scope}]!`,
      affectedSessionsCount: affectedCount,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
