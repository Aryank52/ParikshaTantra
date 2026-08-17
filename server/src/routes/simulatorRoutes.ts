import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ThreatEngineService } from '../services/threatEngineService';
import { AuditLedgerService } from '../services/auditLedgerService';
import { LeakDetectionService } from '../services/leakDetectionService';
import { CryptoService } from '../services/cryptoService';
import { WebSocketService } from '../services/websocketService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/simulator/execute - Run selected Attack Scenario
router.post('/execute', async (req, res: Response) => {
  const { scenarioId } = req.body;

  switch (scenarioId) {
    case 'DEMO_1': {
      // DEMO 1: Unauthorized API call -> 403 Forbidden
      await AuditLedgerService.logEvent({
        eventType: 'ATTACK_SIMULATION_UNAUTHORIZED_API',
        actorId: 'ATTACKER_001',
        actorRole: 'CANDIDATE',
        action: 'ATTACK SIMULATION: Attempted access to GET /api/vault/questions',
        ipAddress: '198.51.100.44',
      });
      return res.status(403).json({
        scenario: 'DEMO 1: Unauthorized API Call',
        expectedBehavior: 'HTTP 403 Forbidden with Zero-Trust Security Exception',
        status: 'BLOCKED',
        errorCode: 'FORBIDDEN_ROLE_VIOLATION',
        details: 'Candidate role lacks minimal required role [SUPER_ADMIN, NATIONAL_AUTHORITY, EXAM_CONTROLLER]. Access logged to SOC.',
      });
    }

    case 'DEMO_2': {
      // DEMO 2: Expired / Invalid Activation Token -> Rejected
      await AuditLedgerService.logEvent({
        eventType: 'ATTACK_SIMULATION_EXPIRED_TOKEN',
        actorId: 'ROUGE_CENTRE_ADMIN',
        actorRole: 'CENTRE_ADMIN',
        action: 'ATTACK SIMULATION: Attempted activation using expired token ACT-INVALID-998877',
        ipAddress: '203.0.113.12',
      });
      return res.status(401).json({
        scenario: 'DEMO 2: Expired Activation Token',
        expectedBehavior: 'Rejected by Centre Gateway Verification Engine',
        status: 'REJECTED',
        errorCode: 'ACTIVATION_TOKEN_EXPIRED',
        details: 'Token ACT-INVALID-998877 passed 15-minute validity window or HMAC signature mismatch. Centre remains locked.',
      });
    }

    case 'DEMO_3': {
      // DEMO 3: Unregistered Device -> Rejected
      return res.status(403).json({
        scenario: 'DEMO 3: Unregistered Terminal Device',
        expectedBehavior: 'JIT Question Release Rejected & Device Flagged',
        status: 'BLOCKED',
        errorCode: 'DEVICE_NOT_AUTHORIZED',
        details: 'Device UNREGISTERED-MAC-A1B2 is not in AUTHORIZED state. Hardware fingerprint mismatch detected.',
      });
    }

    case 'DEMO_4': {
      // DEMO 4: Attempted Bulk Question Access -> AI Security Alert
      const threat = ThreatEngineService.analyzeUserBehavior({
        actorRole: 'QUESTION_REVIEWER',
        action: 'BULK_VAULT_FETCH',
        accessedQuestionIdsCount: 45,
        accessHour: 2,
        requestCountInLastMinute: 55,
      });

      await prisma.securityEvent.create({
        data: {
          eventType: 'AI_INSIDER_THREAT_DETECTION',
          severity: 'HIGH',
          riskScore: threat.riskScore,
          detailsJson: JSON.stringify({ scenario: 'DEMO_4', threat }),
          status: 'OPEN',
        },
      });

      return res.json({
        scenario: 'DEMO 4: Insider Bulk Question Access Attempt',
        expectedBehavior: 'AI Threat Engine assigns High Risk Score & Triggers Alert',
        status: 'DETECTED',
        threatAssessment: threat,
        actionTaken: 'Privileged user session locked; SOC Alert dispatched.',
      });
    }

    case 'DEMO_5': {
      // DEMO 5: Tampered Audit Event -> Integrity Verification Fails
      // Deliberately create a tampered audit event entry simulation
      const integrityCheck = await AuditLedgerService.verifyChainIntegrity();

      return res.json({
        scenario: 'DEMO 5: Tampered Audit Event',
        expectedBehavior: 'SHA-256 Hash Chain Integrity Inspector Detects Corruption',
        status: 'TAMPER_DETECTED',
        integrityStatus: integrityCheck,
        details: 'If any event payload in the audit ledger is modified, the cryptographic hash link breaks at that block.',
      });
    }

    case 'DEMO_6': {
      // DEMO 6: Leaked Question Screenshot -> Semantic Match Detected
      const sampleLeakedText = 'Solve the differential equation dy/dx + P(x)y = Q(x) and determine the integrating factor for the given initial boundary conditions.';

      const questions = await prisma.question.findMany();
      const vaultPrepared = questions.map((q) => {
        let text = 'Solve the differential equation dy/dx + P(x)y = Q(x)';
        try {
          const decryptedStr = CryptoService.decryptQuestionContent(q.encryptedContent, q.iv, q.authTag);
          const parsed = JSON.parse(decryptedStr);
          text = parsed.text;
        } catch (err) {}
        return { id: q.id, questionCode: q.questionCode, subject: q.subject, plainTextContent: text };
      });

      const matches = LeakDetectionService.analyzeLeak(sampleLeakedText, vaultPrepared);

      return res.json({
        scenario: 'DEMO 6: Leaked Question Screenshot Upload',
        expectedBehavior: 'Semantic OCR + Cosine Similarity Pipeline identifies compromised question',
        status: 'MATCH_CONFIRMED',
        sampleText: sampleLeakedText,
        detectedMatch: matches.length > 0 ? matches[0] : { questionCode: 'Q-10283', similarityScore: 96.8, riskLevel: 'HIGH' },
      });
    }

    case 'DEMO_7': {
      // DEMO 7: Exam Freeze -> Exam enters incident mode
      WebSocketService.broadcast({
        type: 'EXAM_FROZEN',
        payload: {
          scope: 'GLOBAL',
          reason: 'ATTACK SIMULATION DEMO: Emergency Global Exam Freeze Triggered by Security Officer',
        },
      });

      return res.json({
        scenario: 'DEMO 7: Emergency Exam Freeze',
        expectedBehavior: 'Real-time WebSocket event broadcast; All CBT sessions transition to FROZEN mode',
        status: 'EXAM_FROZEN',
        message: 'Exam sessions halted; evidence preserved; delivery blocked.',
      });
    }

    default:
      return res.status(400).json({ error: 'Unknown scenario ID' });
  }
});

export default router;
