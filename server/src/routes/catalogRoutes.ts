import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/catalog/exams - Search and filter examination catalog
router.get('/exams', async (req: Request, res: Response) => {
  try {
    const { category, level, state, search } = req.query;

    const whereClause: any = {};

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereClause.category = category;
    }
    if (level && typeof level === 'string' && level !== 'ALL') {
      whereClause.level = level;
    }
    if (state && typeof state === 'string' && state !== 'ALL') {
      whereClause.state = state;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search } },
        { shortName: { contains: search } },
        { authorityName: { contains: search } },
        { authorityCode: { contains: search } }
      ];
    }

    const exams = await prisma.examCatalogEntry.findMany({
      where: whereClause,
      orderBy: { examDate: 'asc' }
    });

    res.json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/states - Get State Master list
router.get('/states', async (_req: Request, res: Response) => {
  try {
    const states = await prisma.stateMaster.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, count: states.length, data: states });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/districts - Get District Master list
router.get('/districts', async (req: Request, res: Response) => {
  try {
    const { stateCode } = req.query;
    const whereClause: any = {};
    if (stateCode && typeof stateCode === 'string') {
      whereClause.stateCode = stateCode;
    }
    const districts = await prisma.districtMaster.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, count: districts.length, data: districts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
