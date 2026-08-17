import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { AuditLedgerService } from '../services/auditLedgerService';

export type Role =
  | 'SUPER_ADMIN'
  | 'NATIONAL_AUTHORITY'
  | 'STATE_AUTHORITY'
  | 'DISTRICT_AUTHORITY'
  | 'EXAM_CONTROLLER'
  | 'QUESTION_REVIEWER'
  | 'QUESTION_APPROVER'
  | 'CENTRE_ADMIN'
  | 'INVIGILATOR'
  | 'SECURITY_OFFICER'
  | 'AUDITOR'
  | 'CANDIDATE';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: Role;
    organizationId?: string;
  };
}

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED_ACCESS',
      message: 'Access Denied: Missing or malformed authentication bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Access Denied: Session token is expired, revoked, or cryptographically invalid.',
    });
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
      // Log security violation to audit ledger
      AuditLedgerService.logEvent({
        eventType: 'UNAUTHORIZED_ROLE_ACCESS_ATTEMPT',
        actorId: req.user.userId,
        actorRole: req.user.role,
        organizationId: req.user.organizationId,
        action: `Attempted ${req.method} ${req.originalUrl} requiring roles [${allowedRoles.join(', ')}]`,
        ipAddress: req.ip,
      }).catch(console.error);

      return res.status(403).json({
        error: 'FORBIDDEN_ROLE_VIOLATION',
        message: `Security Access Violation: Role '${req.user.role}' is not authorized to execute this operation. Minimal required role: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
};
