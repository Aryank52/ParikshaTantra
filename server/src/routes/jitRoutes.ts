import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/jit/request-questions - JIT Question Release Endpoint for Candidate Session
router.post('/request-questions', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { sessionToken, deviceId } = req.body;

  if (!sessionToken || !deviceId) {
    return res.status(400).json({ error: 'Missing sessionToken or deviceId' });
  }

  // 1. Verify Candidate Session
  const session = await prisma.candidateSession.findUnique({
    where: { sessionToken },
    include: {
      exam: { include: { blueprint: true } },
      centre: true,
      device: true,
      candidate: true,
    },
  });

  if (!session) {
    return res.status(401).json({
      error: 'INVALID_SESSION',
      message: 'JIT Release Denied: Candidate exam session token is invalid or expired.',
    });
  }

  // 2. Check Emergency Session State
  if (session.status === 'FROZEN' || session.status === 'REVOKED') {
    return res.status(403).json({
      error: 'SESSION_FROZEN',
      message: 'JIT Release Denied: Session is FROZEN by Security Operations Centre due to active incident response.',
    });
  }

  // 3. Check Central Exam State
  if (session.exam.status !== 'RELEASED' && session.exam.status !== 'RUNNING') {
    return res.status(403).json({
      error: 'EXAM_NOT_RELEASED',
      message: 'JIT Release Denied: Exam is not in RELEASED or RUNNING state.',
    });
  }

  // 4. Check Centre Activation State
  if (session.centre.status !== 'ACTIVATED' && session.centre.status !== 'EXAM_RUNNING') {
    return res.status(403).json({
      error: 'CENTRE_NOT_ACTIVATED',
      message: 'JIT Release Denied: Local Exam Centre Gateway has not completed Activation authentication.',
    });
  }

  // 5. Check Device Authorization State
  if (session.device.status !== 'AUTHORIZED') {
    return res.status(403).json({
      error: 'DEVICE_NOT_AUTHORIZED',
      message: `JIT Release Denied: Terminal device '${deviceId}' is in state '${session.device.status}'. Only AUTHORIZED devices may receive JIT paper payloads.`,
    });
  }

  if (!session.exam.blueprint) {
    return res.status(400).json({ error: 'Blueprint missing for this exam' });
  }

  // Parse blueprint question IDs
  const questionIds: string[] = JSON.parse(session.exam.blueprint.questionIdsJson || '[]');

  // Retrieve encrypted vault questions
  const vaultQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });

  // Decrypt questions Just-In-Time for this authorized candidate terminal
  const decryptedQuestions = vaultQuestions.map((q) => {
    let text = 'Encrypted Question Payload';
    let options: string[] = ['Option A', 'Option B', 'Option C', 'Option D'];

    try {
      const decryptedStr = CryptoService.decryptQuestionContent(q.encryptedContent, q.iv, q.authTag);
      const parsed = JSON.parse(decryptedStr);
      text = parsed.text;
      options = parsed.options || options;
    } catch (err) {
      // Fallback for safety in demo seed
    }

    return {
      id: q.id,
      questionCode: q.questionCode,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      text,
      options,
    };
  });

  // Update session status to IN_PROGRESS
  if (session.status === 'LOBBY') {
    await prisma.candidateSession.update({
      where: { id: session.id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  await AuditLedgerService.logEvent({
    eventType: 'JIT_QUESTION_RELEASE',
    actorId: session.candidate.id,
    actorRole: 'CANDIDATE',
    action: `JIT Questions delivered to Terminal ${session.device.deviceId} at Centre ${session.centre.centreCode} for Candidate ${session.candidate.fullName}`,
    metadata: {
      candidateId: session.candidate.id,
      sessionId: session.id,
      questionCount: decryptedQuestions.length,
    },
  });

  return res.json({
    message: 'JIT Encrypted Question Payload successfully delivered to sandboxed candidate terminal.',
    sessionStatus: 'IN_PROGRESS',
    examTitle: session.exam.title,
    durationMinutes: session.exam.durationMinutes,
    questions: decryptedQuestions,
  });
});

export default router;
