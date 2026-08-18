import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/hardware-check/log
 * Log diagnostic test results for candidate device or centre lab hardware.
 */
router.post('/log', async (req, res) => {
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
        networkLatencyMs: networkLatencyMs || 15,
        overallStatus: overallStatus || 'PASS',
        detailsJson: JSON.stringify(details || {}),
      },
    });

    res.json({
      message: 'Hardware check diagnostics recorded successfully.',
      log,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/hardware-check/logs
 */
router.get('/logs', async (_req, res) => {
  try {
    const logs = await prisma.hardwareCheckLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
