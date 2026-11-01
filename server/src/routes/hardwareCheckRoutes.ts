import { Router, Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/hardware-check/log
 * Log diagnostic test results for candidate device or centre lab hardware.
 * Open to pre-exam device check diagnostics or session check.
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { checkType, entityId, cameraStatus, micStatus, screenRes, storageCap, networkLatencyMs, overallStatus, details } = req.body;

    const log = await prisma.hardwareCheckLog.create({
      data: {
        checkType: checkType || 'CANDIDATE_DEVICE',
        entityId: entityId || 'CANDIDATE-SESSION-UNKNOWN',
        cameraStatus: cameraStatus || 'PASS',
        micStatus: micStatus || 'PASS',
        screenRes: screenRes || '1920x1080',
        storageCap: storageCap || 'Available IndexedDB Storage',
        networkLatencyMs: typeof networkLatencyMs === 'number' ? networkLatencyMs : 15,
        overallStatus: overallStatus || 'PASS',
        detailsJson: JSON.stringify(details || {}),
      },
    });

    return res.json({
      success: true,
      message: 'Hardware check diagnostics recorded successfully.',
      log,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hardware-check/logs
 * Retrieve hardware check audit logs (Authorized staff only).
 */
router.get(
  '/logs',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'CENTRE_ADMIN', 'INVIGILATOR', 'DISTRICT_AUTHORITY', 'STATE_AUTHORITY', 'NATIONAL_AUTHORITY'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = await prisma.hardwareCheckLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return res.json(logs);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
