import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditLedgerService } from '../services/auditLedgerService';

const router = Router();
const prisma = new PrismaClient();

const getClientIp = (req: any): string => {
  if (typeof req.ip === 'string') return req.ip;
  if (Array.isArray(req.ip)) return req.ip[0];
  return '127.0.0.1';
};

// POST /api/auth/login
router.post('/login', async (req: any, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { organization: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
  }

  if (user.isLocked) {
    return res.status(403).json({ error: 'ACCOUNT_LOCKED', message: 'Account is locked by Security Officer due to incident response.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    await AuditLedgerService.logEvent({
      eventType: 'AUTH_FAILED_LOGIN',
      actorId: user.id,
      actorRole: user.role,
      organizationId: user.organizationId || undefined,
      action: `Failed password authentication attempt for user ${user.username}`,
      ipAddress: getClientIp(req),
    });
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
    },
    CONFIG.JWT_SECRET,
    { expiresIn: '8h' as any }
  );

  await AuditLedgerService.logEvent({
    eventType: 'AUTH_SUCCESSFUL_LOGIN',
    actorId: user.id,
    actorRole: user.role,
    organizationId: user.organizationId || undefined,
    action: `User ${user.username} authenticated successfully with role ${user.role}`,
    ipAddress: getClientIp(req),
  });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organization: user.organization,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { organization: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organization: user.organization,
    },
  });
});

// GET /api/auth/demo-users
router.get('/demo-users', async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      organization: { select: { name: true, code: true } },
    },
  });
  return res.json(users);
});

export default router;
