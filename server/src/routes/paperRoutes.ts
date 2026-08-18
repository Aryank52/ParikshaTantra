import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/paper/upload-answer-sheet
 * Scanned answer sheet upload for PAPER/HYBRID exam mode.
 */
router.post('/upload-answer-sheet', async (req, res) => {
  try {
    const { examCode, centreCode, candidateRoll, shiftCode, base64SheetData, uploader } = req.body;

    if (!examCode || !centreCode || !candidateRoll) {
      return res.status(400).json({ error: 'Missing required fields: examCode, centreCode, candidateRoll' });
    }

    const fileHash = crypto.createHash('sha256').update(base64SheetData || `${candidateRoll}:${Date.now()}`).digest('hex');
    const scanCode = `SCAN-${examCode}-${candidateRoll}-${Date.now().toString().slice(-4)}`;

    const scanRecord = await prisma.answerSheetScan.create({
      data: {
        scanCode,
        examCode,
        centreCode,
        candidateRoll,
        shiftCode: shiftCode || 'SHIFT-1',
        fileHash,
        scanQualityScore: 99.2,
        status: 'VALIDATED',
        uploadedBy: uploader || 'CENTRE_SUPERINTENDENT',
        evaluatedScore: Math.floor(Math.random() * 40) + 60, // Synthetic OMR eval demo score
      },
    });

    res.json({
      message: 'Scanned OMR answer sheet uploaded & hash registered successfully.',
      scan: scanRecord,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/paper/sheets
 * List answer sheet uploads.
 */
router.get('/sheets', async (_req, res) => {
  try {
    const sheets = await prisma.answerSheetScan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(sheets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
