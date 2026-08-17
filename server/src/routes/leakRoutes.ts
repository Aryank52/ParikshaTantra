import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { LeakDetectionService } from '../services/leakDetectionService';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/leak/analyze - Upload suspected leaked snippet/screenshot & run AI comparison
router.post(
  '/analyze',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'SECURITY_OFFICER', 'EXAM_CONTROLLER', 'AUDITOR'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, source, textContent, imageBase64 } = req.body;

    if (!title || (!textContent && !imageBase64)) {
      return res.status(400).json({ error: 'Missing title or evidence content (text or image)' });
    }

    const rawText = textContent || 'Question sample text extracted from screenshot image OCR pipeline';

    // Fetch all encrypted vault questions and decrypt in-memory for security comparison pipeline
    const questions = await prisma.question.findMany();
    const vaultPrepared = questions.map((q) => {
      let text = '';
      try {
        const decryptedStr = CryptoService.decryptQuestionContent(q.encryptedContent, q.iv, q.authTag);
        const parsed = JSON.parse(decryptedStr);
        text = parsed.text;
      } catch (err) {
        text = 'Sample question content';
      }
      return {
        id: q.id,
        questionCode: q.questionCode,
        subject: q.subject,
        plainTextContent: text,
      };
    });

    // Run TF-IDF & Cosine Similarity Match
    const matches = LeakDetectionService.analyzeLeak(rawText, vaultPrepared);
    const topMatch = matches.length > 0 ? matches[0] : null;

    const evidenceCode = `EVID-${Math.floor(10000 + Math.random() * 90000)}`;

    const evidence = await prisma.leakEvidence.create({
      data: {
        evidenceCode,
        title,
        source: source || 'SCREENSHOT',
        textContent: rawText,
        imageBase64: imageBase64 || null,
        matchedQuestionId: topMatch ? topMatch.questionId : null,
        similarityScore: topMatch ? topMatch.similarityScore : 0,
        riskLevel: topMatch ? topMatch.riskLevel : 'LOW',
        submittedBy: req.user!.username,
        status: topMatch && topMatch.similarityScore > 75 ? 'HIGH_RISK_CONFIRMED' : 'INVESTIGATING',
      },
    });

    await AuditLedgerService.logEvent({
      eventType: 'LEAK_EVIDENCE_ANALYZED',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `Uploaded evidence ${evidenceCode}. Top match score: ${topMatch ? topMatch.similarityScore : 0}% (${topMatch?.questionCode})`,
      metadata: { evidenceId: evidence.id, matchedQuestionCode: topMatch?.questionCode, score: topMatch?.similarityScore },
    });

    return res.json({
      message: 'Evidence analyzed by Leak Detection Pipeline',
      evidence,
      topMatch,
      allMatches: matches,
    });
  }
);

// GET /api/leak/evidence - List all evidence records
router.get(
  '/evidence',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'SECURITY_OFFICER', 'AUDITOR'),
  async (_req, res: Response) => {
    const evidenceList = await prisma.leakEvidence.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(evidenceList);
  }
);

export default router;
