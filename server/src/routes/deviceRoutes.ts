import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJwt, authorizeRoles, AuthenticatedRequest, Role } from '../middleware/authMiddleware';
import { AuditLedgerService } from '../services/auditLedgerService';
import { WebSocketService } from '../services/websocketService';
import { CryptoService } from '../services/cryptoService';

const router = Router();

const getClientIp = (req: any): string => {
  if (typeof req.ip === 'string') return req.ip;
  if (Array.isArray(req.ip)) return req.ip[0];
  return '127.0.0.1';
};

const DEVICE_OVERSIGHT_ROLES: Role[] = [
  'SUPER_ADMIN',
  'NATIONAL_AUTHORITY',
  'STATE_AUTHORITY',
  'DISTRICT_AUTHORITY',
  'EXAM_CONTROLLER',
  'CENTRE_ADMIN',
  'INVIGILATOR',
  'SECURITY_OFFICER',
  'AUDITOR',
];

/**
 * GET /api/devices
 * Role-scoped device inventory with filtering by centreId, status, and search query.
 */
router.get(
  '/',
  authenticateJwt,
  authorizeRoles(...DEVICE_OVERSIGHT_ROLES),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const { centreId, status, search, limit = '100', offset = '0' } = req.query;

      const take = Math.min(parseInt(limit as string, 10) || 100, 250);
      const skip = parseInt(offset as string, 10) || 0;

      const where: any = {};

      // Role scoping:
      if (user.role === 'STATE_AUTHORITY' && user.organizationId) {
        where.centre = { organizationId: user.organizationId };
      }
      if (['CENTRE_ADMIN', 'INVIGILATOR'].includes(user.role) && user.organizationId) {
        where.centre = { organizationId: user.organizationId };
      }

      if (centreId && typeof centreId === 'string' && centreId !== 'ALL') {
        where.OR = [
          { centreId },
          { centre: { centreCode: centreId } },
        ];
      }

      if (status && typeof status === 'string' && status !== 'ALL') {
        where.status = status;
      }

      if (search && typeof search === 'string') {
        const q = search.trim();
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { deviceId: { contains: q, mode: 'insensitive' } },
              { serialNumber: { contains: q, mode: 'insensitive' } },
              { ipAddress: { contains: q } },
              { centre: { name: { contains: q, mode: 'insensitive' } } },
              { centre: { centreCode: { contains: q, mode: 'insensitive' } } },
            ],
          },
        ];
      }

      const [total, devices] = await Promise.all([
        prisma.registeredDevice.count({ where }),
        prisma.registeredDevice.findMany({
          where,
          include: {
            centre: {
              select: {
                id: true,
                centreCode: true,
                name: true,
                state: true,
                district: true,
                connectivityStatus: true,
                securityStatus: true,
              },
            },
            candidateSessions: {
              where: { status: { in: ['LOBBY', 'IN_PROGRESS', 'PAUSED'] } },
              select: {
                id: true,
                sessionToken: true,
                status: true,
                candidate: { select: { fullName: true, candidateCode: true } },
              },
              take: 1,
            },
          },
          orderBy: [{ status: 'asc' }, { deviceId: 'asc' }],
          take,
          skip,
        }),
      ]);

      // Retrieve recent hardware check logs for these devices
      const deviceIds = devices.map((d) => d.deviceId);
      const recentLogs = await prisma.hardwareCheckLog.findMany({
        where: { entityId: { in: deviceIds } },
        orderBy: { createdAt: 'desc' },
        take: deviceIds.length * 2,
      });

      const formattedDevices = devices.map((dev) => {
        const latestLog = recentLogs.find((l) => l.entityId === dev.deviceId);
        return {
          id: dev.id,
          deviceId: dev.deviceId,
          serialNumber: dev.serialNumber,
          ipAddress: dev.ipAddress,
          hardwareHash: dev.hardwareHash,
          status: dev.status,
          lastHeartbeat: dev.lastHeartbeat,
          createdAt: dev.createdAt,
          centre: dev.centre,
          activeSession: dev.candidateSessions[0] || null,
          diagnostics: {
            cameraStatus: latestLog?.cameraStatus || 'PASS',
            micStatus: latestLog?.micStatus || 'PASS',
            screenRes: latestLog?.screenRes || '1920x1080',
            networkLatencyMs: latestLog?.networkLatencyMs ?? 25,
            overallStatus: latestLog?.overallStatus || (dev.status === 'AUTHORIZED' ? 'PASS' : 'WARNING'),
            lastCheckedAt: latestLog?.createdAt || dev.lastHeartbeat,
          },
        };
      });

      return res.json({
        devices: formattedDevices,
        pagination: {
          total,
          limit: take,
          offset: skip,
          hasMore: skip + take < total,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch device inventory' });
    }
  }
);

/**
 * GET /api/devices/:id
 * Retrieve single device details, diagnostics history, and audit trail.
 */
router.get(
  '/:id',
  authenticateJwt,
  authorizeRoles(...DEVICE_OVERSIGHT_ROLES),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const device = await prisma.registeredDevice.findFirst({
        where: {
          OR: [
            { id },
            { deviceId: id },
          ],
        },
        include: {
          centre: true,
          candidateSessions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { candidate: true, exam: true },
          },
        },
      });

      if (!device) return res.status(404).json({ error: 'Device not found' });

      // Hardware check history
      const hardwareLogs = await prisma.hardwareCheckLog.findMany({
        where: { entityId: device.deviceId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Audit history
      const auditEvents = await prisma.auditEvent.findMany({
        where: {
          OR: [
            { deviceId: device.id },
            { action: { contains: device.deviceId } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return res.json({
        device,
        hardwareLogs,
        auditEvents,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve device' });
    }
  }
);

/**
 * POST /api/devices/:id/authorize
 * Authorize device for exam operations.
 */
router.post(
  '/:id/authorize',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'EXAM_CONTROLLER', 'CENTRE_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { examId, reason } = req.body;

      const device = await prisma.registeredDevice.findFirst({
        where: { OR: [{ id }, { deviceId: id }] },
        include: { centre: true },
      });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      if (device.status === 'QUARANTINED') {
        return res.status(400).json({
          error: 'DEVICE_QUARANTINED',
          message: 'Quarantined device cannot be authorized directly. Requires formal unquarantine inspection clearance.',
        });
      }

      const previousStatus = device.status;
      const updated = await prisma.registeredDevice.update({
        where: { id: device.id },
        data: {
          status: 'AUTHORIZED',
          lastHeartbeat: new Date(),
        },
        include: { centre: true },
      });

      // Generate time-bounded exam-scoped challenge token if examId provided
      let examAuthToken: string | undefined = undefined;
      if (examId) {
        const timeWindow = Math.floor(Date.now() / (1000 * 60 * 15));
        examAuthToken = CryptoService.generateDeviceAuthorizationToken(examId, 'EXAM', device.centreId, device.deviceId, timeWindow);
      }

      await AuditLedgerService.logEvent({
        eventType: 'DEVICE_AUTHORIZED',
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: `Terminal ${device.deviceId} AUTHORIZED for CBT operations at Centre ${device.centre.centreCode}. Reason: ${reason || 'Pre-exam terminal authorization verification'}`,
        deviceId: device.id,
        ipAddress: getClientIp(req),
        metadata: {
          previousStatus,
          newStatus: 'AUTHORIZED',
          centreId: device.centreId,
          examId,
          reason,
        },
      });

      WebSocketService.broadcastDeviceStatus(device.deviceId, device.centre.centreCode, device.centre.state, 'AUTHORIZED', {
        examAuthToken,
      });

      return res.json({
        success: true,
        message: `Device ${device.deviceId} successfully authorized for examination delivery.`,
        device: updated,
        examAuthToken,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Authorization failed' });
    }
  }
);

/**
 * POST /api/devices/:id/suspend
 * Temporarily suspend device (e.g. maintenance, peripheral swap).
 */
router.post(
  '/:id/suspend',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'EXAM_CONTROLLER', 'CENTRE_ADMIN', 'INVIGILATOR'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      const device = await prisma.registeredDevice.findFirst({
        where: { OR: [{ id }, { deviceId: id }] },
        include: { centre: true },
      });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const previousStatus = device.status;
      const updated = await prisma.registeredDevice.update({
        where: { id: device.id },
        data: { status: 'SUSPENDED' },
        include: { centre: true },
      });

      await AuditLedgerService.logEvent({
        eventType: 'DEVICE_SUSPENDED',
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: `Terminal ${device.deviceId} SUSPENDED at Centre ${device.centre.centreCode}. Reason: ${reason || 'Operational maintenance suspension'}`,
        deviceId: device.id,
        ipAddress: getClientIp(req),
        metadata: { previousStatus, newStatus: 'SUSPENDED', reason },
      });

      WebSocketService.broadcastDeviceStatus(device.deviceId, device.centre.centreCode, device.centre.state, 'SUSPENDED', {
        reason,
      });

      return res.json({
        success: true,
        message: `Device ${device.deviceId} has been temporarily SUSPENDED.`,
        device: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Suspension failed' });
    }
  }
);

/**
 * POST /api/devices/:id/revoke
 * Permanently revoke terminal authorization.
 */
router.post(
  '/:id/revoke',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'SECURITY_OFFICER'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ error: 'Mandatory revocation rationale required' });
      }

      const device = await prisma.registeredDevice.findFirst({
        where: { OR: [{ id }, { deviceId: id }] },
        include: { centre: true },
      });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const previousStatus = device.status;
      const updated = await prisma.registeredDevice.update({
        where: { id: device.id },
        data: { status: 'REVOKED' },
        include: { centre: true },
      });

      await AuditLedgerService.logEvent({
        eventType: 'DEVICE_REVOKED',
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: `Terminal ${device.deviceId} REVOKED from Centre ${device.centre.centreCode}. Reason: ${reason}`,
        deviceId: device.id,
        ipAddress: getClientIp(req),
        metadata: { previousStatus, newStatus: 'REVOKED', reason },
      });

      WebSocketService.broadcastDeviceStatus(device.deviceId, device.centre.centreCode, device.centre.state, 'REVOKED', {
        reason,
      });

      return res.json({
        success: true,
        message: `Device ${device.deviceId} authorization has been REVOKED.`,
        device: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Revocation failed' });
    }
  }
);

/**
 * POST /api/devices/:id/quarantine
 * Quarantine a compromised, malfunctioning, or tampered terminal device.
 */
router.post(
  '/:id/quarantine',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'STATE_AUTHORITY', 'EXAM_CONTROLLER', 'CENTRE_ADMIN', 'SECURITY_OFFICER'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ error: 'Mandatory quarantine reason required' });
      }

      const device = await prisma.registeredDevice.findFirst({
        where: { OR: [{ id }, { deviceId: id }] },
        include: { centre: true },
      });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const previousStatus = device.status;
      const updated = await prisma.registeredDevice.update({
        where: { id: device.id },
        data: { status: 'QUARANTINED' },
        include: { centre: true },
      });

      // Abort any active candidate session on this device
      await prisma.candidateSession.updateMany({
        where: { deviceId: device.id, status: { in: ['LOBBY', 'IN_PROGRESS', 'PAUSED'] } },
        data: { status: 'FROZEN' },
      });

      await AuditLedgerService.logEvent({
        eventType: 'DEVICE_QUARANTINED',
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: `CRITICAL: Terminal ${device.deviceId} QUARANTINED at Centre ${device.centre.centreCode}. Reason: ${reason}`,
        deviceId: device.id,
        ipAddress: getClientIp(req),
        metadata: { previousStatus, newStatus: 'QUARANTINED', reason },
      });

      WebSocketService.broadcastDeviceQuarantine(device.deviceId, device.centre.centreCode, device.centre.state, reason);

      return res.json({
        success: true,
        message: `CRITICAL: Terminal ${device.deviceId} has been QUARANTINED. Active sessions frozen.`,
        device: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Quarantine failed' });
    }
  }
);

/**
 * POST /api/devices/:id/unquarantine
 * Clear device quarantine following physical inspection and verification clearance.
 */
router.post(
  '/:id/unquarantine',
  authenticateJwt,
  authorizeRoles('SUPER_ADMIN', 'NATIONAL_AUTHORITY', 'EXAM_CONTROLLER', 'SECURITY_OFFICER'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ error: 'Mandatory clearance justification (>= 10 chars) required to lift quarantine' });
      }

      const device = await prisma.registeredDevice.findFirst({
        where: { OR: [{ id }, { deviceId: id }] },
        include: { centre: true },
      });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const previousStatus = device.status;
      const updated = await prisma.registeredDevice.update({
        where: { id: device.id },
        data: {
          status: 'PENDING_AUTHORIZATION',
          lastHeartbeat: new Date(),
        },
        include: { centre: true },
      });

      await AuditLedgerService.logEvent({
        eventType: 'DEVICE_UNQUARANTINED',
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: `Terminal ${device.deviceId} UNQUARANTINED at Centre ${device.centre.centreCode}. Clearance: ${reason}`,
        deviceId: device.id,
        ipAddress: getClientIp(req),
        metadata: { previousStatus, newStatus: 'PENDING_AUTHORIZATION', reason },
      });

      WebSocketService.broadcastDeviceStatus(device.deviceId, device.centre.centreCode, device.centre.state, 'PENDING_AUTHORIZATION', {
        clearanceReason: reason,
      });

      return res.json({
        success: true,
        message: `Terminal ${device.deviceId} quarantine lifted. Status set to PENDING_AUTHORIZATION.`,
        device: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Unquarantine failed' });
    }
  }
);

/**
 * POST /api/devices/:id/hardware-check
 * Run or record hardware diagnostic check results for this device.
 */
router.post(
  '/:id/hardware-check',
  authenticateJwt,
  authorizeRoles(...DEVICE_OVERSIGHT_ROLES),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { cameraStatus, micStatus, screenRes, storageCap, networkLatencyMs, details } = req.body;

      const device = await prisma.registeredDevice.findFirst({
        where: { OR: [{ id }, { deviceId: id }] },
        include: { centre: true },
      });
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const overallStatus =
        cameraStatus === 'FAIL' || micStatus === 'FAIL'
          ? 'FAIL'
          : cameraStatus === 'WARNING' || micStatus === 'WARNING' || (networkLatencyMs && networkLatencyMs > 200)
          ? 'WARNING'
          : 'PASS';

      const log = await prisma.hardwareCheckLog.create({
        data: {
          checkType: 'CENTRE_LAB',
          entityId: device.deviceId,
          cameraStatus: cameraStatus || 'PASS',
          micStatus: micStatus || 'PASS',
          screenRes: screenRes || '1920x1080',
          storageCap: storageCap || '4GB Allocated Local Buffer',
          networkLatencyMs: typeof networkLatencyMs === 'number' ? networkLatencyMs : 20,
          overallStatus,
          detailsJson: JSON.stringify(details || {}),
        },
      });

      // Update lastHeartbeat
      await prisma.registeredDevice.update({
        where: { id: device.id },
        data: { lastHeartbeat: new Date() },
      });

      WebSocketService.broadcast({
        type: 'HARDWARE_CHECK_COMPLETED',
        payload: {
          deviceId: device.deviceId,
          centreCode: device.centre.centreCode,
          overallStatus,
          cameraStatus: log.cameraStatus,
          micStatus: log.micStatus,
          networkLatencyMs: log.networkLatencyMs,
          timestamp: Date.now(),
        },
      });

      return res.json({
        success: true,
        message: 'Hardware check diagnostics recorded successfully.',
        log,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Hardware check failed' });
    }
  }
);

export default router;
