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

export default router;
