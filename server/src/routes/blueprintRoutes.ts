import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/blueprint/generate - Generate cryptographically signed blueprint for an exam
router.post(
  '/generate',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { examId, subjectDistribution, difficultyDistribution } = req.body;

    if (!examId) return res.status(400).json({ error: 'Missing examId' });

    const exam = await prisma.exam.findUnique({ where: { id: examId as string } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const vaultedQuestions = await prisma.question.findMany({
      where: { status: 'ENCRYPTED' },
    });

    if (vaultedQuestions.length === 0) {
      return res.status(400).json({
        error: 'NO_VAULTED_QUESTIONS',
        message: 'Blueprint generation failed: No 4-Eyes fully approved encrypted questions in the Question Vault.',
      });
    }

    const selectedQuestionIds = vaultedQuestions.map((q) => q.id);

    const defaultSubjectDist = subjectDistribution || { Mathematics: 5, Reasoning: 5, GeneralKnowledge: 5 };
    const defaultDiffDist = difficultyDistribution || { Easy: '30%', Medium: '50%', Hard: '20%' };

    const packageChecksum = CryptoService.hashContent(
      `${examId}:${selectedQuestionIds.join(',')}:${JSON.stringify(defaultSubjectDist)}`
    );
    const signedChecksum = CryptoService.signPayload(packageChecksum);

    const blueprint = await prisma.examBlueprint.upsert({
      where: { examId: examId as string },
      update: {
        subjectDistributionJson: JSON.stringify(defaultSubjectDist),
        difficultyDistributionJson: JSON.stringify(defaultDiffDist),
        questionIdsJson: JSON.stringify(selectedQuestionIds),
        signedChecksum,
      },
      create: {
        examId: examId as string,
        subjectDistributionJson: JSON.stringify(defaultSubjectDist),
        difficultyDistributionJson: JSON.stringify(defaultDiffDist),
        questionIdsJson: JSON.stringify(selectedQuestionIds),
        signedChecksum,
      },
    });

    await AuditLedgerService.logEvent({
      eventType: 'EXAM_BLUEPRINT_GENERATED',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `Generated & signed Exam Blueprint for Exam ${exam.examCode}. Total questions: ${selectedQuestionIds.length}`,
      metadata: { examId, blueprintId: blueprint.id, signedChecksum },
    });

    return res.json({
      message: 'Exam Blueprint successfully constructed and cryptographically signed.',
      blueprint,
      selectedQuestionCount: selectedQuestionIds.length,
      signedChecksum,
    });
  }
);

// GET /api/blueprint/:examId - Retrieve exam blueprint
router.get('/:examId', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const examId = req.params.examId as string;

  const blueprint = await prisma.examBlueprint.findUnique({
    where: { examId },
    include: { exam: true },
  });

  if (!blueprint) return res.status(404).json({ error: 'Blueprint not found for this exam' });

  return res.json(blueprint);
});

export default router;
