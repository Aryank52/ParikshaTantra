import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/control-tower/metrics - Aggregated National Exam Day Operations Data
router.get(
  '/metrics',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'SECURITY_OFFICER', 'AUDITOR', 'EXAM_CONTROLLER'),
  async (_req: AuthenticatedRequest, res: Response) => {
    const activeExams = await prisma.exam.count({
      where: { status: { in: ['RELEASED', 'ACTIVE', 'RUNNING'] } },
    });

    const totalExams = await prisma.exam.count();
    const totalCentres = await prisma.examCentre.count();
    const activatedCentres = await prisma.examCentre.count({ where: { status: 'ACTIVATED' } });
    const onlineCentres = await prisma.examCentre.count({ where: { connectivityStatus: 'ONLINE' } });
    const degradedCentres = await prisma.examCentre.count({ where: { connectivityStatus: 'DEGRADED' } });

    const activeSessions = await prisma.candidateSession.count({ where: { status: 'IN_PROGRESS' } });
    const totalCandidates = await prisma.candidate.count();
    const verifiedCandidates = await prisma.candidate.count({ where: { isVerifiedAtCentre: true } });

    const authorizedDevices = await prisma.registeredDevice.count({ where: { status: 'AUTHORIZED' } });
    const blockedDevices = await prisma.registeredDevice.count({ where: { status: 'BLOCKED' } });

    const criticalIncidents = await prisma.securityEvent.count({ where: { severity: 'CRITICAL', status: 'OPEN' } });
    const totalEvents = await prisma.securityEvent.count();

    const recentIncidents = await prisma.securityEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { centre: { select: { name: true, centreCode: true, state: true } } },
    });

    const timelineMilestones = [
      { time: '05:00', title: 'Exam Package Encrypted & Signed', status: 'COMPLETED' },
      { time: '07:30', title: 'Exam Centre Readiness Audits', status: 'COMPLETED' },
      { time: '08:00', title: 'HMAC Activation Window Opened', status: 'COMPLETED' },
      { time: '08:30', title: 'CBT Terminal Hardware Verification', status: 'COMPLETED' },
      { time: '08:45', title: 'Physical Candidate Biometric Entry', status: 'IN_PROGRESS' },
      { time: '09:15', title: 'Admit Card & Seat Allocation Lock', status: 'UPCOMING' },
      { time: '09:30', title: 'Global Exam Release & JIT Question Delivery', status: 'UPCOMING' },
      { time: '12:30', title: 'Exam Completion & Submissions Sealed', status: 'UPCOMING' },
      { time: '13:00', title: 'SHA-256 Audit Ledger Freeze & Result Approval', status: 'UPCOMING' },
    ];

    return res.json({
      summary: {
        activeExams,
        totalExams,
        totalCentres,
        activatedCentres,
        onlineCentres,
        degradedCentres,
        activeSessions,
        totalCandidates,
        verifiedCandidates,
        authorizedDevices,
        blockedDevices,
        criticalIncidents,
        totalEvents,
        terminalHealthPercentage: totalCentres > 0 ? Math.round((authorizedDevices / (totalCentres * 20)) * 100) : 98,
      },
      recentIncidents,
      timelineMilestones,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
