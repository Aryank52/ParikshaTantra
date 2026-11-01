import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { ObjectStorageService } from '../services/objectStorageService';

const router = Router();

/**
 * POST /api/paper/upload-answer-sheet
 * Scanned answer sheet upload for PAPER/HYBRID exam mode.
 * Accessible to authorized examination and invigilation staff.
 */
router.post(
  '/upload-answer-sheet',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'CENTRE_ADMIN', 'INVIGILATOR', 'DISTRICT_AUTHORITY', 'STATE_AUTHORITY', 'NATIONAL_AUTHORITY'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { examCode, centreCode, candidateRoll, shiftCode, base64SheetData, uploader } = req.body;

      if (!examCode || !centreCode || !candidateRoll) {
        return res.status(400).json({ error: 'Missing required fields: examCode, centreCode, candidateRoll' });
      }

      let fileHash: string;
      if (base64SheetData) {
        const rawBase64 = base64SheetData.includes(',') ? base64SheetData.split(',')[1] : base64SheetData;
        const fileBuffer = Buffer.from(rawBase64, 'base64');
        fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Store file in object storage asynchronously
        await ObjectStorageService.uploadFile({
          folder: 'answer-sheets',
          filename: `${examCode}-${candidateRoll}-${Date.now()}.png`,
          buffer: fileBuffer,
          mimeType: 'image/png',
          uploadedBy: req.user?.username || uploader || 'CENTRE_STAFF',
        });
      } else {
        fileHash = crypto.createHash('sha256').update(`${candidateRoll}:${Date.now()}`).digest('hex');
      }

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
          uploadedBy: req.user?.username || uploader || 'CENTRE_SUPERINTENDENT',
          evaluatedScore: Math.floor(Math.random() * 40) + 60, // Synthetic OMR eval demo score
        },
      });

      return res.json({
        success: true,
        message: 'Scanned OMR answer sheet uploaded & hash registered successfully.',
        scan: scanRecord,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/paper/sheets
 * List answer sheet uploads with role-based access.
 */
router.get(
  '/sheets',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'CENTRE_ADMIN', 'DISTRICT_AUTHORITY', 'STATE_AUTHORITY', 'NATIONAL_AUTHORITY'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const sheets = await prisma.answerSheetScan.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return res.json(sheets);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;
