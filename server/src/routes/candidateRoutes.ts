import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';
import { CryptoService } from '../services/cryptoService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/candidate/admit-card/:candidateCode - Candidate Admit Card Details
router.get('/admit-card/:candidateCode', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const candidateCode = req.params.candidateCode as string;

  const candidate = await prisma.candidate.findUnique({
    where: { candidateCode },
    include: {
      allocatedCentre: true,
    },
  });

  if (!candidate) return res.status(404).json({ error: 'Candidate profile not found' });

  const rollNumber = `2026-NEET-${CryptoService.hashContent(candidate.candidateCode).substring(0, 6).toUpperCase()}`;
  const assignedSeatNode = candidate.allocatedTerminalId ? 'Terminal Node 14B' : 'Terminal Node 08A';

  return res.json({
    candidateCode: candidate.candidateCode,
    fullName: candidate.fullName,
    email: candidate.email,
    identityHash: candidate.identityHash,
    rollNumber,
    category: 'GENERAL / OBC',
    allocatedCentre: candidate.allocatedCentre ? {
      centreCode: candidate.allocatedCentre.centreCode,
      name: candidate.allocatedCentre.name,
      address: candidate.allocatedCentre.address,
      state: candidate.allocatedCentre.state,
      district: candidate.allocatedCentre.district,
      geolocation: candidate.allocatedCentre.geolocation,
    } : null,
    assignedSeatNode,
    admitCardSignedChecksum: CryptoService.signPayload(`ADMIT:${candidate.candidateCode}:${rollNumber}`),
    issuedAt: new Date().toISOString(),
  });
});

// POST /api/candidate/verify-attendance - Physical Centre Candidate Verification & Node Assignment
router.post('/verify-attendance', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { candidateCode, centreId, terminalNode, status } = req.body;

  if (!candidateCode) {
    return res.status(400).json({ error: 'Missing candidateCode' });
  }

  const candidate = await prisma.candidate.findUnique({ where: { candidateCode } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const updatedCandidate = await prisma.candidate.update({
    where: { candidateCode },
    data: {
      isVerifiedAtCentre: true,
      allocatedCentreId: centreId || candidate.allocatedCentreId,
      allocatedTerminalId: terminalNode || candidate.allocatedTerminalId || 'Terminal Node 14B',
    },
  });

  const { AuditLedgerService } = await import('../services/auditLedgerService.js');
  await AuditLedgerService.logEvent({
    eventType: 'CANDIDATE_CENTRE_VERIFIED',
    actorId: req.user!.userId,
    actorRole: req.user!.role,
    action: `Verified candidate ${candidate.fullName} (${candidate.candidateCode}) at Centre. Seat Assigned: ${updatedCandidate.allocatedTerminalId}`,
    metadata: { candidateCode, centreId, terminalNode, status: status || 'VERIFIED' },
  });

  return res.json({
    message: `Candidate ${candidate.fullName} VERIFIED! Terminal Node ${updatedCandidate.allocatedTerminalId} assigned.`,
    candidate: updatedCandidate,
  });
});

export default router;

