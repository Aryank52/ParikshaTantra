import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { AuditLedgerService } from '../services/auditLedgerService';
import { prisma } from '../lib/prisma';

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

/**
 * Middleware to enforce organization/tenant scoping.
 * Prevents cross-organization data access by validating that
 * the requested resource belongs to the user's organization.
 * 
 * SUPER_ADMIN bypasses all org scoping.
 * NATIONAL_AUTHORITY can access within their organization.
 * Other roles are restricted to their organization.
 */
export const enforceOrgScope = (resourceType: 'exam' | 'centre' | 'candidate' | 'question' | 'session' | 'submission' | 'certificate') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    // SUPER_ADMIN has global access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // If user has no organization, they can only access public resources
    if (!req.user.organizationId) {
      return res.status(403).json({
        error: 'ORG_SCOPE_VIOLATION',
        message: 'User is not associated with any organization. Cannot access organization-scoped resources.',
      });
    }

    const resourceId = req.params.id || req.body.examId || req.body.centreId || req.body.candidateId || req.body.questionId || req.body.sessionId || req.body.submissionId || req.body.certificateId;

    if (!resourceId) {
      // No specific resource ID to check - allow but log warning
      return next();
    }

    let hasAccess = false;

    try {
      switch (resourceType) {
        case 'exam': {
          const exam = await prisma.exam.findUnique({ where: { id: resourceId }, select: { organizationId: true } });
          hasAccess = exam?.organizationId === req.user.organizationId;
          break;
        }
        case 'centre': {
          const centre = await prisma.examCentre.findUnique({ where: { id: resourceId }, select: { organizationId: true } });
          hasAccess = centre?.organizationId === req.user.organizationId;
          break;
        }
        case 'candidate': {
          const candidate = await prisma.candidate.findUnique({ where: { id: resourceId }, select: { allocatedCentre: { select: { organizationId: true } } } });
          hasAccess = candidate?.allocatedCentre?.organizationId === req.user.organizationId;
          break;
        }
        case 'question': {
          // Questions are global but created by users from organizations
          const question = await prisma.question.findUnique({ where: { id: resourceId }, select: { createdBy: { select: { organizationId: true } } } });
          hasAccess = question?.createdBy?.organizationId === req.user.organizationId || req.user.role === 'NATIONAL_AUTHORITY';
          break;
        }
        case 'session': {
          const session = await prisma.candidateSession.findUnique({ where: { id: resourceId }, select: { exam: { select: { organizationId: true } } } });
          hasAccess = session?.exam?.organizationId === req.user.organizationId;
          break;
        }
        case 'submission': {
          const submission = await prisma.submission.findUnique({ where: { id: resourceId }, select: { exam: { select: { organizationId: true } } } });
          hasAccess = submission?.exam?.organizationId === req.user.organizationId;
          break;
        }
        case 'certificate': {
          const certificate = await prisma.certificate.findUnique({ where: { id: resourceId }, select: { exam: { select: { organizationId: true } } } });
          hasAccess = certificate?.exam?.organizationId === req.user.organizationId;
          break;
        }
        default:
          hasAccess = true;
      }

      if (!hasAccess) {
        await AuditLedgerService.logEvent({
          eventType: 'ORG_SCOPE_VIOLATION_ATTEMPT',
          actorId: req.user.userId,
          actorRole: req.user.role,
          organizationId: req.user.organizationId,
          action: `Attempted cross-organization access to ${resourceType} ${resourceId}`,
          ipAddress: req.ip,
        }).catch(console.error);

        return res.status(403).json({
          error: 'ORG_SCOPE_VIOLATION',
          message: `Access denied: ${resourceType} belongs to a different organization.`,
        });
      }

      next();
    } catch (error) {
      console.error('Org scope enforcement error:', error);
      return res.status(500).json({ error: 'Internal error during authorization check' });
    }
  };
};
