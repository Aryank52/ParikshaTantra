import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';
import { ThreatEngineService } from '../services/threatEngineService';
import { WebSocketService } from '../services/websocketService';

const router = Router();
const prisma = new PrismaClient();

const getClientIp = (req: any): string => {
  if (typeof req.ip === 'string') return req.ip;
  if (Array.isArray(req.ip)) return req.ip[0];
  return '127.0.0.1';
};

// GET /api/vault/questions - Query vaulted questions with threat monitoring
router.get(
  '/questions',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'QUESTION_REVIEWER', 'QUESTION_APPROVER', 'AUDITOR'),
  async (req: AuthenticatedRequest, res: Response) => {
    const count = await prisma.question.count();

    const threatAnalysis = ThreatEngineService.analyzeUserBehavior({
      actorRole: req.user!.role,
      action: 'QUESTION_VAULT_BULK_QUERY',
      accessedQuestionIdsCount: count,
      ipAddress: getClientIp(req),
    });

    if (threatAnalysis.riskScore > 80) {
      await prisma.securityEvent.create({
        data: {
          eventType: 'INSIDER_THREAT_BULK_VAULT_QUERY',
          severity: 'HIGH',
          riskScore: threatAnalysis.riskScore,
          detailsJson: JSON.stringify({
            user: req.user,
            reasons: threatAnalysis.reasons,
          }),
        },
      });

      WebSocketService.broadcast({
        type: 'SECURITY_ALERT',
        payload: {
          title: 'High Risk Vault Access Alert',
          user: req.user?.username,
          riskScore: threatAnalysis.riskScore,
          reasons: threatAnalysis.reasons,
        },
      });
    }

    const questions = await prisma.question.findMany({
      include: {
        createdBy: { select: { fullName: true, username: true } },
        reviewedBy: { select: { fullName: true, username: true } },
        approvedByA: { select: { fullName: true, username: true } },
        approvedByB: { select: { fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const safeQuestions = questions.map((q) => ({
      id: q.id,
      questionCode: q.questionCode,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      status: q.status,
      questionHash: q.questionHash,
      createdBy: q.createdBy.fullName,
      reviewedBy: q.reviewedBy?.fullName || null,
      approvedByA: q.approvedByA?.fullName || null,
      approvedByB: q.approvedByB?.fullName || null,
      createdAt: q.createdAt,
    }));

    return res.json({
      questions: safeQuestions,
      threatAssessment: threatAnalysis,
    });
  }
);

// POST /api/vault/create - Create question in DRAFT state
router.post(
  '/create',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'QUESTION_REVIEWER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { subject, topic, difficulty, language, marks, negativeMarks, plainTextContent, options, correctAnswerIndex } = req.body;

    if (!subject || !topic || !plainTextContent || options === undefined || correctAnswerIndex === undefined) {
      return res.status(400).json({ error: 'Missing required question fields.' });
    }

    const fullContentObj = { text: plainTextContent, options, correctAnswerIndex };
    const fullContentStr = JSON.stringify(fullContentObj);

    const encrypted = CryptoService.encryptQuestionContent(fullContentStr);
    const questionHash = CryptoService.hashContent(fullContentStr);
    const digitalSig = CryptoService.signPayload(questionHash);
    const qCode = `Q-${Math.floor(10000 + Math.random() * 90000)}`;

    const question = await prisma.question.create({
      data: {
        questionCode: qCode,
        subject,
        topic,
        difficulty: difficulty || 'MEDIUM',
        language: language || 'ENGLISH',
        marks: marks || 1.0,
        negativeMarks: negativeMarks || 0.25,
        encryptedContent: encrypted.cipherText,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        questionHash,
        digitalSignature: digitalSig,
        status: 'DRAFT',
        createdById: req.user!.userId,
      },
    });

    await AuditLedgerService.logEvent({
      eventType: 'QUESTION_CREATED',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `Created Question ${question.questionCode} in DRAFT state`,
      ipAddress: getClientIp(req),
      metadata: { questionId: question.id, questionCode: question.questionCode, subject },
    });

    return res.status(201).json({ message: 'Question created in DRAFT state', question });
  }
);

// POST /api/vault/review/:id - Move DRAFT to REVIEW
router.post(
  '/review/:id',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'QUESTION_REVIEWER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    if (question.status !== 'DRAFT') {
      return res.status(400).json({ error: `Cannot review question in ${question.status} state. Must be DRAFT.` });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        status: 'REVIEW',
        reviewedById: req.user!.userId,
      },
    });

    await AuditLedgerService.logEvent({
      eventType: 'QUESTION_REVIEWED',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `Reviewed question ${updated.questionCode}. Transitioned to REVIEW state.`,
      ipAddress: getClientIp(req),
      metadata: { questionId: updated.id },
    });

    return res.json({ message: 'Question reviewed and moved to REVIEW state', question: updated });
  }
);

// POST /api/vault/approve-dual/:id - 4-Eyes Dual Approval Endpoint
router.post(
  '/approve-dual/:id',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'QUESTION_APPROVER', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const { approverSlot } = req.body;

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    if (question.status !== 'REVIEW' && question.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Question must be in REVIEW state for 4-Eyes approval.' });
    }

    let updateData: any = {};

    if (approverSlot === 'A') {
      if (question.approvedByIdA) {
        return res.status(400).json({ error: 'Approver A has already signed this question.' });
      }
      updateData.approvedByIdA = req.user!.userId;
    } else if (approverSlot === 'B') {
      if (question.approvedByIdB) {
        return res.status(400).json({ error: 'Approver B has already signed this question.' });
      }
      if (question.approvedByIdA === req.user!.userId) {
        return res.status(400).json({ error: '4-Eyes Security Constraint: Approver B must be a DIFFERENT person than Approver A.' });
      }
      updateData.approvedByIdB = req.user!.userId;
    } else {
      return res.status(400).json({ error: 'Invalid approver slot. Use "A" or "B".' });
    }

    const isNowFullyApproved =
      (question.approvedByIdA || approverSlot === 'A') &&
      (question.approvedByIdB || approverSlot === 'B');

    if (isNowFullyApproved) {
      updateData.status = 'ENCRYPTED';
    } else {
      updateData.status = 'APPROVED';
    }

    const updated = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    await AuditLedgerService.logEvent({
      eventType: 'QUESTION_4EYES_APPROVAL',
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: `Approver Slot ${approverSlot} signed question ${question.questionCode}. Full Vault State: ${updated.status}`,
      ipAddress: getClientIp(req),
      metadata: { questionId: question.id, approverSlot, status: updated.status },
    });

    return res.json({
      message: isNowFullyApproved
        ? '4-Eyes Dual Approval Completed! Question is now Cryptographically Vaulted.'
        : `Approval Slot ${approverSlot} recorded. Awaiting second approver signature for 4-Eyes compliance.`,
      question: updated,
    });
  }
);

export default router;
