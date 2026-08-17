import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// POST /api/registration/eligibility-check
router.post('/eligibility-check', async (req: Request, res: Response) => {
  try {
    const { examCatalogCode, age, qualification } = req.body;

    const exam = await prisma.examCatalogEntry.findUnique({
      where: { catalogCode: examCatalogCode }
    });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam catalog entry not found' });
    }

    const candidateAge = parseInt(age, 10);
    const isEligibleAge = candidateAge >= exam.minAge && candidateAge <= exam.maxAge;
    const isEligibleEducation = qualification.toUpperCase().includes(exam.minEducation.toUpperCase()) || candidateAge >= 21;

    const isEligible = isEligibleAge && isEligibleEducation;

    res.json({
      success: true,
      isEligible,
      reasons: [
        isEligibleAge ? `Age (${candidateAge}) meets criteria (${exam.minAge}-${exam.maxAge} yrs)` : `Age (${candidateAge}) outside required range (${exam.minAge}-${exam.maxAge} yrs)`,
        isEligibleEducation ? `Qualification (${qualification}) satisfies minimum criteria (${exam.minEducation})` : `Qualification does not satisfy ${exam.minEducation}`
      ]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/registration/apply - Candidate Application Submission & Auto Admit Card Generation
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { fullName, email, category, dob, qualification, examCatalogCode, preferredCity1, preferredCity2 } = req.body;

    const exam = await prisma.examCatalogEntry.findUnique({
      where: { catalogCode: examCatalogCode }
    });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam catalog entry not found' });
    }

    const appNumber = `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const rollNumber = `2026-${exam.authorityCode}-${Math.floor(100000 + Math.random() * 900000)}`;

    const application = await prisma.candidateApplication.create({
      data: {
        applicationNumber: appNumber,
        candidateId: `CAND-${rollNumber}`,
        examCatalogCode,
        fullName,
        email,
        category: category || 'GENERAL',
        dob,
        qualification,
        preferredCity1,
        preferredCity2,
        status: 'APPROVED',
        feePaid: true
      }
    });

    // Auto allocate seat node & digital signature checksum
    const labNode = `Terminal Node ${Math.floor(1 + Math.random() * 40)}${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}`;
    const sigPayload = `${rollNumber}:${appNumber}:${fullName}:${exam.title}:${labNode}`;
    const digitalSignature = crypto.createHmac('sha256', 'PARIKSHATANTRA_SECRET_KEY').update(sigPayload).digest('hex');
    const qrChecksum = `QR-${crypto.createHash('sha256').update(digitalSignature).digest('hex').substring(0, 16).toUpperCase()}`;

    const admitCard = await prisma.admitCard.create({
      data: {
        rollNumber,
        applicationNumber: appNumber,
        candidateName: fullName,
        examTitle: exam.title,
        examCode: exam.catalogCode,
        category: category || 'GENERAL',
        assignedCentreCode: 'CENTRE-DELHI-01',
        assignedCentreName: 'TCS iON Digital Zone iDZ 1, Dwarka Sector 14',
        assignedCity: preferredCity1 || 'Delhi NCR',
        assignedLabNode: labNode,
        reportingTime: '08:00 AM IST',
        gateClosingTime: '09:00 AM IST',
        digitalSignature,
        qrChecksum
      }
    });

    res.json({
      success: true,
      application,
      admitCard
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/registration/admit-card/:rollNumber
router.get('/admit-card/:rollNumber', async (req: Request, res: Response) => {
  try {
    const searchVal = String(req.params.rollNumber);
    const admitCard = await prisma.admitCard.findFirst({
      where: {
        OR: [
          { rollNumber: searchVal },
          { applicationNumber: searchVal }
        ]
      }
    });

    if (!admitCard) {
      return res.status(404).json({ success: false, error: 'Admit Card not found' });
    }

    res.json({ success: true, admitCard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
