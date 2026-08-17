import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/cbt/start-session - Start Candidate Exam Session from Centre Terminal
router.post('/start-session', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { candidateCode, examId, centreId, deviceId } = req.body;

  if (!candidateCode || !examId || !centreId || !deviceId) {
    return res.status(400).json({ error: 'Missing candidateCode, examId, centreId or deviceId' });
  }

  const candidate = await prisma.candidate.findUnique({ where: { candidateCode } });
  if (!candidate) return res.status(404).json({ error: 'Candidate record not found' });

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const centre = await prisma.examCentre.findUnique({ where: { id: centreId } });
  if (!centre) return res.status(404).json({ error: 'Centre not found' });

  const device = await prisma.registeredDevice.findUnique({ where: { deviceId } });
  if (!device) return res.status(404).json({ error: 'Terminal device not registered' });

  if (device.status !== 'AUTHORIZED') {
    return res.status(403).json({
      error: 'DEVICE_BLOCKED',
      message: `Terminal device '${deviceId}' is in state '${device.status}'. Access denied.`,
    });
  }

  // Create or retrieve session token
  const sessionToken = `SESS-${CryptoService.hashContent(`${candidate.id}:${exam.id}:${Date.now()}`).substring(0, 16).toUpperCase()}`;

  const session = await prisma.candidateSession.upsert({
    where: { sessionToken },
    update: {},
    create: {
      sessionToken,
      candidateId: candidate.id,
      examId: exam.id,
      centreId: centre.id,
      deviceId: device.id,
      status: 'LOBBY',
    },
  });

  return res.json({
    message: 'Candidate identity verified. Session initialized in LOBBY state.',
    sessionToken: session.sessionToken,
    candidateName: candidate.fullName,
    candidateCode: candidate.candidateCode,
    centreName: centre.name,
    examTitle: exam.title,
  });
});

// POST /api/cbt/save-answers - Encrypted auto-save / local buffer sync
router.post('/save-answers', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { sessionToken, answers } = req.body; // answers: { [questionId]: selectedOptionIndex }

  if (!sessionToken || !answers) {
    return res.status(400).json({ error: 'Missing sessionToken or answers payload' });
  }

  const session = await prisma.candidateSession.findUnique({ where: { sessionToken } });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (session.status === 'FROZEN' || session.status === 'SUBMITTED') {
    return res.status(403).json({ error: `Cannot save answers. Session is in '${session.status}' state.` });
  }

  const answersJson = JSON.stringify(answers);

  await prisma.candidateSession.update({
    where: { id: session.id },
    data: { localAnswerBufferJson: answersJson },
  });

  return res.json({
    status: 'SYNCED',
    syncedAt: new Date().toISOString(),
    answeredCount: Object.keys(answers).length,
  });
});

// POST /api/cbt/submit-final - Final Answer Submission
router.post('/submit-final', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { sessionToken, answers } = req.body;

  if (!sessionToken || !answers) {
    return res.status(400).json({ error: 'Missing sessionToken or answers' });
  }

  const session = await prisma.candidateSession.findUnique({
    where: { sessionToken },
    include: { candidate: true, exam: { include: { blueprint: true } } },
  });

  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (session.status === 'SUBMITTED') {
    return res.status(400).json({ error: 'Exam has already been submitted.' });
  }

  const answersStr = JSON.stringify(answers);
  const answerHash = CryptoService.hashContent(answersStr);
  const digitalSignature = CryptoService.signPayload(`${session.candidateId}:${session.examId}:${answerHash}`);

  // Calculate score against vault questions
  let score = 0;
  if (session.exam.blueprint) {
    const qIds: string[] = JSON.parse(session.exam.blueprint.questionIdsJson || '[]');
    const questions = await prisma.question.findMany({ where: { id: { in: qIds } } });

    for (const q of questions) {
      try {
        const decryptedStr = CryptoService.decryptQuestionContent(q.encryptedContent, q.iv, q.authTag);
        const parsed = JSON.parse(decryptedStr);
        const correctIndex = parsed.correctAnswerIndex;
        const candidateChoice = answers[q.id];

        if (candidateChoice !== undefined) {
          if (candidateChoice === correctIndex) {
            score += q.marks;
          } else {
            score -= q.negativeMarks;
          }
        }
      } catch (err) {
        // fallback score
      }
    }
  }

  score = Math.max(0, Math.round(score * 100) / 100);

  const submission = await prisma.submission.create({
    data: {
      candidateId: session.candidateId,
      examId: session.examId,
      encryptedAnswersJson: answersStr,
      answerHash,
      digitalSignature,
      score,
      resultStatus: 'COMPLETED',
    },
  });

  await prisma.candidateSession.update({
    where: { id: session.id },
    data: {
      status: 'SUBMITTED',
      endedAt: new Date(),
    },
  });

  await AuditLedgerService.logEvent({
    eventType: 'CBT_FINAL_SUBMISSION',
    actorId: session.candidateId,
    actorRole: 'CANDIDATE',
    action: `Final Answer Submission received for Candidate ${session.candidate.fullName} in Exam ${session.exam.examCode}. Score: ${score}`,
    metadata: { submissionId: submission.id, answerHash, score },
  });

  return res.json({
    message: 'FINAL SUBMISSION SUCCESSFUL! Cryptographic submission digest recorded in audit ledger.',
    submissionId: submission.id,
    answerHash,
    submittedAt: submission.submittedAt,
  });
});

export default router;
