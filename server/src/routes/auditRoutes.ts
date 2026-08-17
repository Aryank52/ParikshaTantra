import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditLedgerService } from '../services/auditLedgerService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/audit/logs - Fetch audit log ledger
router.get(
  '/logs',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'AUDITOR', 'SECURITY_OFFICER', 'EXAM_CONTROLLER'),
  async (req: AuthenticatedRequest, res: Response) => {
    const logs = await prisma.auditEvent.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    return res.json(logs);
  }
);

// GET /api/audit/verify-chain - Verify SHA-256 Tamper-Evident Hash Chain Integrity
router.get(
  '/verify-chain',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'AUDITOR', 'SECURITY_OFFICER'),
  async (_req, res: Response) => {
    const result = await AuditLedgerService.verifyChainIntegrity();
    return res.json(result);
  }
);

export default router;
