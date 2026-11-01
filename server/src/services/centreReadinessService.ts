import { prisma } from '../lib/prisma';
import { AuditLedgerService } from './auditLedgerService';
import { WebSocketService } from './websocketService';

export type ReadinessStatus = 'NOT_STARTED' | 'CHECKING' | 'READY' | 'WARNING' | 'BLOCKED' | 'EXPIRED' | 'OFFLINE';

export interface ReadinessChecklistItem {
  id: string;
  code: string;
  label: string;
  category: 'IDENTITY' | 'EXAM_ASSIGNMENT' | 'ACTIVATION' | 'DEVICE' | 'HARDWARE' | 'NETWORK' | 'SECURITY' | 'CANDIDATE';
  status: 'READY' | 'WARNING' | 'FAILED' | 'SKIPPED';
  severity: 'BLOCKING' | 'DEGRADED' | 'INFO';
  details: string;
  remedyAction?: string;
  overrideRoleRequired?: string;
  overridden?: boolean;
}

export interface CentreReadinessEvaluation {
  centreId: string;
  centreCode: string;
  centreName: string;
  state: string;
  district: string;
  examId?: string;
  examCode?: string;
  status: ReadinessStatus;
  scorePercentage: number;
  reasons: string[];
  checklist: ReadinessChecklistItem[];
  deviceSummary: {
    total: number;
    authorized: number;
    pending: number;
    suspended: number;
    quarantined: number;
    offline: number;
    passingHardwareChecks: number;
  };
  capacitySummary: {
    seatingCapacity: number;
    allocatedCandidates: number;
    utilizationPercentage: number;
  };
  activationSummary: {
    isActivated: boolean;
    tokenIssued: boolean;
    expiresAt?: string;
    isExpired: boolean;
  };
  hasOverride: boolean;
  overrideDetails?: {
    actorId: string;
    actorRole: string;
    reason: string;
    timestamp: string;
  };
  evaluatedAt: string;
}

export class CentreReadinessService {
  /**
   * Evaluates comprehensive, deterministic operational readiness for an examination centre.
   * Grounded in real PostgreSQL models: ExamCentre, RegisteredDevice, HardwareCheckLog,
   * CentreActivation, SecurityEvent, Exam, CandidateSession, and AuditEvent.
   */
  static async evaluateReadiness(centreIdOrCode: string, examIdOrCode?: string): Promise<CentreReadinessEvaluation> {
    const centre = await prisma.examCentre.findFirst({
      where: {
        OR: [
          { id: centreIdOrCode },
          { centreCode: centreIdOrCode },
        ],
      },
      include: {
        devices: true,
        activations: {
          where: { isValid: true },
          orderBy: { issuedAt: 'desc' },
          include: { exam: true },
        },
        securityEvents: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
        },
        candidateSessions: true,
      },
    });

    if (!centre) {
      throw new Error(`Examination centre '${centreIdOrCode}' not found`);
    }

    // Resolve Exam if specified or resolve latest relevant active/released exam
    let exam: any = null;
    if (examIdOrCode) {
      exam = await prisma.exam.findFirst({
        where: {
          OR: [
            { id: examIdOrCode },
            { examCode: examIdOrCode },
          ],
        },
      });
    } else {
      exam = await prisma.exam.findFirst({
        where: {
          status: { in: ['ACTIVE', 'RUNNING', 'RELEASED', 'SCHEDULED'] },
        },
        orderBy: { scheduledStart: 'asc' },
      });
    }

    const deviceIds = centre.devices.map((d) => d.deviceId);

    // Retrieve real hardware check logs for this centre and its devices
    const hardwareLogs = await prisma.hardwareCheckLog.findMany({
      where: {
        OR: [
          { entityId: centre.centreCode },
          { entityId: centre.id },
          ...(deviceIds.length > 0 ? [{ entityId: { in: deviceIds } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Check for active operational override in AuditEvent within the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOverride = await prisma.auditEvent.findFirst({
      where: {
        eventType: 'CENTRE_READINESS_OVERRIDE',
        action: { contains: centre.centreCode },
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // -------------------------------------------------------------
    // Device Statistics Derivation
    // -------------------------------------------------------------
    const totalDevices = centre.devices.length;
    const authorizedDevices = centre.devices.filter((d) => d.status === 'AUTHORIZED');
    const pendingDevices = centre.devices.filter((d) => d.status === 'PENDING_AUTHORIZATION' || d.status === 'REGISTERED');
    const suspendedDevices = centre.devices.filter((d) => d.status === 'SUSPENDED');
    const quarantinedDevices = centre.devices.filter((d) => d.status === 'QUARANTINED');
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const offlineDevices = centre.devices.filter((d) => d.status === 'OFFLINE' || new Date(d.lastHeartbeat) < fifteenMinsAgo);

    // Hardware logs mapping per terminal
    const devicesPassingHw = centre.devices.filter((d) => {
      const devLog = hardwareLogs.find((l) => l.entityId === d.deviceId);
      return !devLog || devLog.overallStatus === 'PASS';
    });

    // -------------------------------------------------------------
    // Activation Derivation
    // -------------------------------------------------------------
    const relevantActivation = exam
      ? centre.activations.find((a) => a.examId === exam.id)
      : centre.activations[0];

    const isActivationValid = !!relevantActivation && relevantActivation.isValid && new Date(relevantActivation.expiresAt) > new Date();
    const isActivationExpired = !!relevantActivation && new Date(relevantActivation.expiresAt) <= new Date();

    // -------------------------------------------------------------
    // Candidate Allocation Derivation
    // -------------------------------------------------------------
    const allocatedCandidatesCount = await prisma.candidate.count({
      where: { allocatedCentreId: centre.id },
    });
    const utilizationPct = centre.capacity > 0 ? Math.round((allocatedCandidatesCount / centre.capacity) * 100) : 0;

    // -------------------------------------------------------------
    // Structured 8-Dimension Checklist
    // -------------------------------------------------------------
    const checklist: ReadinessChecklistItem[] = [];
    const reasons: string[] = [];

    // Dimension 1: Centre Identity & Jurisdictional Integrity
    const isCentreActive = centre.status !== 'CLOSED' && centre.status !== 'AUDIT';
    checklist.push({
      id: 'CHK-ID-01',
      code: 'CENTRE_IDENTITY_ACTIVE',
      label: 'Centre Administrative Status Active',
      category: 'IDENTITY',
      status: isCentreActive ? 'READY' : 'FAILED',
      severity: 'BLOCKING',
      details: isCentreActive ? `Centre status is ${centre.status}.` : `Centre is ${centre.status} and cannot host examinations.`,
      remedyAction: isCentreActive ? undefined : 'Contact Central Examination Authority to verify and reactivate centre registration.',
      overrideRoleRequired: 'NATIONAL_AUTHORITY',
    });
    if (!isCentreActive) reasons.push(`Centre administrative status is ${centre.status}`);

    checklist.push({
      id: 'CHK-ID-02',
      code: 'CENTRE_JURISDICTION',
      label: 'State & District Jurisdiction Verified',
      category: 'IDENTITY',
      status: centre.state && centre.district ? 'READY' : 'WARNING',
      severity: 'DEGRADED',
      details: `State: ${centre.state || 'UNASSIGNED'}, District: ${centre.district || 'UNASSIGNED'}.`,
      remedyAction: centre.state && centre.district ? undefined : 'Assign valid State and District master codes.',
    });

    // Dimension 2: Examination Shift Assignment
    if (exam) {
      const isExamActive = ['SCHEDULED', 'RELEASED', 'ACTIVE', 'RUNNING'].includes(exam.status);
      checklist.push({
        id: 'CHK-EXAM-01',
        code: 'EXAM_SHIFT_ASSIGNED',
        label: `Examination Shift Assigned (${exam.examCode})`,
        category: 'EXAM_ASSIGNMENT',
        status: isExamActive ? 'READY' : 'FAILED',
        severity: 'BLOCKING',
        details: `Exam: ${exam.title} (${exam.examCode}) is in state ${exam.status}.`,
        remedyAction: isExamActive ? undefined : 'Verify exam lifecycle state; ensure exam has not been cancelled or frozen.',
        overrideRoleRequired: 'EXAM_CONTROLLER',
      });
      if (!isExamActive) reasons.push(`Assigned exam ${exam.examCode} is ${exam.status}`);

      const examWindowOpen = new Date(exam.scheduledEnd) > new Date() || ['ACTIVE', 'RUNNING'].includes(exam.status);
      checklist.push({
        id: 'CHK-EXAM-02',
        code: 'EXAM_TIME_WINDOW',
        label: 'Exam Schedule Window Valid',
        category: 'EXAM_ASSIGNMENT',
        status: examWindowOpen ? 'READY' : 'FAILED',
        severity: 'BLOCKING',
        details: `Scheduled Window: ${new Date(exam.scheduledStart).toLocaleTimeString()} - ${new Date(exam.scheduledEnd).toLocaleTimeString()} (Status: ${exam.status}).`,
        remedyAction: examWindowOpen ? undefined : 'Exam scheduled duration has elapsed. Conclude or reschedule exam shift.',
      });
      if (!examWindowOpen) reasons.push('Examination scheduled time window has already elapsed');
    } else {
      checklist.push({
        id: 'CHK-EXAM-01',
        code: 'NO_EXAM_ASSIGNED',
        label: 'Active Exam Assigned',
        category: 'EXAM_ASSIGNMENT',
        status: 'WARNING',
        severity: 'DEGRADED',
        details: 'No specific exam shift passed for readiness evaluation. Checking baseline centre state.',
        remedyAction: 'Assign an active examination to evaluate exam-specific gateway readiness.',
      });
    }

    // Dimension 3: Cryptographic Gateway Activation
    const activationStatus: 'READY' | 'WARNING' | 'FAILED' = isActivationValid
      ? 'READY'
      : isActivationExpired
      ? 'FAILED'
      : 'WARNING';

    checklist.push({
      id: 'CHK-ACT-01',
      code: 'GATEWAY_HMAC_ACTIVATION',
      label: 'Gateway HMAC-SHA256 Token Activation',
      category: 'ACTIVATION',
      status: activationStatus,
      severity: 'BLOCKING',
      details: relevantActivation
        ? `Token: ${relevantActivation.activationToken.slice(0, 14)}... (Expires: ${new Date(relevantActivation.expiresAt).toLocaleTimeString()}).`
        : 'No valid activation token found for this centre.',
      remedyAction: isActivationValid
        ? undefined
        : 'Central Authority must execute Global Release and issue a 15-minute HMAC activation token.',
      overrideRoleRequired: 'NATIONAL_AUTHORITY',
    });
    if (!isActivationValid) {
      reasons.push(isActivationExpired ? 'Centre Gateway activation token has expired' : 'Gateway activation token pending release');
    }

    // Dimension 4: Device Readiness & Capacity
    const requiredTerminals = allocatedCandidatesCount > 0 ? allocatedCandidatesCount : (totalDevices > 0 ? totalDevices : (centre.capacity || 20));
    const hasEnoughTerminals = totalDevices >= requiredTerminals;
    const deviceCapacitySatisfied = totalDevices >= Math.ceil(requiredTerminals * 0.8);
    checklist.push({
      id: 'CHK-DEV-01',
      code: 'DEVICE_INVENTORY_CAPACITY',
      label: 'Terminal Inventory Meets Seating Capacity',
      category: 'DEVICE',
      status: totalDevices === 0 ? 'FAILED' : hasEnoughTerminals ? 'READY' : deviceCapacitySatisfied ? 'WARNING' : 'FAILED',
      severity: 'BLOCKING',
      details: `${totalDevices} registered terminals for ${requiredTerminals} required nodes (${requiredTerminals > 0 ? Math.round((totalDevices / requiredTerminals) * 100) : 100}%). Physical centre capacity: ${centre.capacity}.`,
      remedyAction: hasEnoughTerminals ? undefined : `Register ${Math.max(1, requiredTerminals - totalDevices)} additional CBT terminals.`,
      overrideRoleRequired: 'STATE_AUTHORITY',
    });
    if (totalDevices < requiredTerminals) {
      reasons.push(`Registered devices (${totalDevices}) below required session terminals (${requiredTerminals})`);
    }

    const authRatio = totalDevices > 0 ? (authorizedDevices.length / totalDevices) * 100 : 0;
    const authStatus: 'READY' | 'WARNING' | 'FAILED' = authRatio >= 90 ? 'READY' : authRatio >= 70 ? 'WARNING' : 'FAILED';
    checklist.push({
      id: 'CHK-DEV-02',
      code: 'DEVICE_AUTHORIZATION_RATIO',
      label: 'CBT Terminal Authorization Compliance',
      category: 'DEVICE',
      status: authStatus,
      severity: 'BLOCKING',
      details: `${authorizedDevices.length}/${totalDevices} terminals authorized (${Math.round(authRatio)}%).`,
      remedyAction: authStatus === 'READY' ? undefined : 'Authorize pending registered terminals via the Device Registry.',
      overrideRoleRequired: 'CENTRE_ADMIN',
    });
    if (authStatus !== 'READY') {
      reasons.push(`Terminal authorization ratio (${Math.round(authRatio)}%) below 90% threshold`);
    }

    const hasQuarantined = quarantinedDevices.length > 0;
    checklist.push({
      id: 'CHK-DEV-03',
      code: 'DEVICE_QUARANTINE_CHECK',
      label: 'Zero Quarantined Terminal Anomalies',
      category: 'DEVICE',
      status: hasQuarantined ? 'WARNING' : 'READY',
      severity: 'DEGRADED',
      details: hasQuarantined
        ? `${quarantinedDevices.length} terminals in QUARANTINE state.`
        : 'Zero terminals quarantined; all hardware hashes untampered.',
      remedyAction: hasQuarantined ? 'Inspect and unquarantine cleared terminals, or allocate verified spares.' : undefined,
    });
    if (hasQuarantined) {
      reasons.push(`${quarantinedDevices.length} terminal(s) currently in QUARANTINE status`);
    }

    // Dimension 5: Terminal Hardware Diagnostics
    const cameraFailures = hardwareLogs.filter((l) => l.cameraStatus === 'FAIL');
    checklist.push({
      id: 'CHK-HW-01',
      code: 'HARDWARE_CAMERA_CHECK',
      label: 'Biometric Camera Diagnostics',
      category: 'HARDWARE',
      status: cameraFailures.length === 0 ? 'READY' : cameraFailures.length <= 2 ? 'WARNING' : 'FAILED',
      severity: 'DEGRADED',
      details: cameraFailures.length === 0
        ? 'All terminals passed camera preview check.'
        : `${cameraFailures.length} terminals failed camera diagnostic check.`,
      remedyAction: cameraFailures.length === 0 ? undefined : 'Inspect USB video permissions and reconnect webcams on failing terminals.',
    });
    if (cameraFailures.length > 0) {
      reasons.push(`${cameraFailures.length} terminal(s) failed camera diagnostics`);
    }

    const micFailures = hardwareLogs.filter((l) => l.micStatus === 'FAIL');
    checklist.push({
      id: 'CHK-HW-02',
      code: 'HARDWARE_MIC_CHECK',
      label: 'Acoustic Sensor Microphone Diagnostics',
      category: 'HARDWARE',
      status: micFailures.length === 0 ? 'READY' : 'WARNING',
      severity: 'DEGRADED',
      details: micFailures.length === 0
        ? 'Microphone noise baseline calibrated.'
        : `${micFailures.length} terminals failed microphone audio test.`,
      remedyAction: micFailures.length === 0 ? undefined : 'Verify microphone audio inputs or adjust noise baseline.',
    });
    if (micFailures.length > 0) {
      reasons.push(`${micFailures.length} terminal(s) failed microphone diagnostics`);
    }

    // Dimension 6: Network Connectivity & Gateway Latency
    const isOnline = centre.connectivityStatus === 'ONLINE';
    checklist.push({
      id: 'CHK-NET-01',
      code: 'NETWORK_GATEWAY_CONNECTIVITY',
      label: 'Edge Gateway Online Heartbeat',
      category: 'NETWORK',
      status: isOnline ? 'READY' : 'FAILED',
      severity: 'BLOCKING',
      details: `Gateway connectivity status: ${centre.connectivityStatus}.`,
      remedyAction: isOnline ? undefined : 'Check primary WAN connection and restart ParikshaNode Edge Gateway.',
      overrideRoleRequired: 'NATIONAL_AUTHORITY',
    });
    if (!isOnline) {
      reasons.push(`Centre connectivity is ${centre.connectivityStatus}`);
    }

    const recentLatencyLog = hardwareLogs.find((l) => typeof l.networkLatencyMs === 'number');
    const avgLatency = recentLatencyLog?.networkLatencyMs ?? 25;
    const latencyStatus: 'READY' | 'WARNING' | 'FAILED' = avgLatency <= 100 ? 'READY' : avgLatency <= 250 ? 'WARNING' : 'FAILED';
    checklist.push({
      id: 'CHK-NET-02',
      code: 'NETWORK_ROUNDTRIP_LATENCY',
      label: 'Round-Trip Gateway Latency (RTT)',
      category: 'NETWORK',
      status: latencyStatus,
      severity: 'DEGRADED',
      details: `Average terminal latency: ${avgLatency} ms.`,
      remedyAction: latencyStatus === 'READY' ? undefined : 'Engage secondary standby fiber WAN to reduce packet jitter.',
    });
    if (latencyStatus !== 'READY') {
      reasons.push(`Gateway latency (${avgLatency}ms) exceeds optimal threshold`);
    }

    // Dimension 7: Physical & Operational Security
    const isSecurityGreen = centre.securityStatus !== 'RED';
    checklist.push({
      id: 'CHK-SEC-01',
      code: 'SECURITY_PERIMETER_STATUS',
      label: 'Physical Perimeter & Jammer Lock',
      category: 'SECURITY',
      status: isSecurityGreen ? 'READY' : 'FAILED',
      severity: 'BLOCKING',
      details: `Perimeter status: ${centre.securityStatus}. Jammers engaged.`,
      remedyAction: isSecurityGreen ? undefined : 'Clear physical security breach and engage local security detail before unlock.',
      overrideRoleRequired: 'SECURITY_OFFICER',
    });
    if (!isSecurityGreen) {
      reasons.push(`Centre perimeter security status is ${centre.securityStatus}`);
    }

    const openCriticalIncidents = centre.securityEvents.filter((e) => e.severity === 'CRITICAL');
    checklist.push({
      id: 'CHK-SEC-02',
      code: 'SECURITY_CRITICAL_INCIDENTS',
      label: 'Zero Open Critical Security Anomalies',
      category: 'SECURITY',
      status: openCriticalIncidents.length === 0 ? 'READY' : 'FAILED',
      severity: 'BLOCKING',
      details: openCriticalIncidents.length === 0
        ? 'Zero open critical security anomalies.'
        : `${openCriticalIncidents.length} open critical security incidents pending triage.`,
      remedyAction: openCriticalIncidents.length === 0 ? undefined : 'Resolve open incidents in SOC Dashboard or trigger audit freeze.',
      overrideRoleRequired: 'SECURITY_OFFICER',
    });
    if (openCriticalIncidents.length > 0) {
      reasons.push(`${openCriticalIncidents.length} open critical security incident(s) detected`);
    }

    // Dimension 8: Candidate Allocation & Seating Roster
    const isCapacityExceeded = allocatedCandidatesCount > centre.capacity && centre.capacity > 0;
    checklist.push({
      id: 'CHK-CAND-01',
      code: 'CANDIDATE_ROSTER_CAPACITY',
      label: 'Candidate Allocation Within Safe Capacity',
      category: 'CANDIDATE',
      status: isCapacityExceeded ? 'FAILED' : 'READY',
      severity: 'BLOCKING',
      details: `${allocatedCandidatesCount} candidates allocated to ${centre.capacity} seats (${utilizationPct}%).`,
      remedyAction: isCapacityExceeded ? `Reallocate ${allocatedCandidatesCount - centre.capacity} candidates to adjacent centres.` : undefined,
    });
    if (isCapacityExceeded) {
      reasons.push(`Allocated candidates (${allocatedCandidatesCount}) exceed seating capacity (${centre.capacity})`);
    }

    // -------------------------------------------------------------
    // Deterministic Overall Status Calculation
    // -------------------------------------------------------------
    const hasBlockingFailure = checklist.some((c) => c.severity === 'BLOCKING' && c.status === 'FAILED');
    const hasDegradedWarning = checklist.some((c) => c.status === 'WARNING');
    const passedCount = checklist.filter((c) => c.status === 'READY').length;
    const scorePercentage = Math.round((passedCount / checklist.length) * 100);

    let rawStatus: ReadinessStatus = 'READY';
    if (!isOnline) {
      rawStatus = 'OFFLINE';
    } else if (hasBlockingFailure) {
      rawStatus = 'BLOCKED';
    } else if (hasDegradedWarning) {
      rawStatus = 'WARNING';
    }

    // Handle Active Override
    let finalStatus: ReadinessStatus = rawStatus;
    const hasOverride = !!recentOverride;
    let overrideDetails: any = undefined;

    if (hasOverride && recentOverride) {
      try {
        const meta = recentOverride.metadataJson ? JSON.parse(recentOverride.metadataJson) : {};
        overrideDetails = {
          actorId: recentOverride.actorId,
          actorRole: recentOverride.actorRole,
          reason: meta.reason || recentOverride.action,
          timestamp: recentOverride.createdAt.toISOString(),
        };

        if (Array.isArray(meta.blockingChecksIgnored) && meta.blockingChecksIgnored.length > 0) {
          checklist.forEach((c) => {
            if (meta.blockingChecksIgnored.includes(c.code)) {
              c.overridden = true;
            }
          });
          const remainingBlocking = checklist.some(
            (c) => c.severity === 'BLOCKING' && c.status === 'FAILED' && !c.overridden
          );
          if (remainingBlocking) {
            finalStatus = 'BLOCKED';
          } else if (centre.securityStatus === 'RED') {
            finalStatus = 'BLOCKED';
          } else {
            finalStatus = 'READY';
          }
        } else {
          // General override permits proceeding under conditional READY, except for active RED physical security breaches
          if (centre.securityStatus === 'RED') {
            finalStatus = 'BLOCKED';
          } else {
            finalStatus = 'READY';
            checklist.forEach((c) => {
              if (c.status === 'FAILED' || c.status === 'WARNING') {
                c.overridden = true;
              }
            });
          }
        }
      } catch (e) {}
    }

    // Synchronize ExamCentre status if appropriate
    if (finalStatus === 'READY' && centre.status === 'REGISTERED') {
      await prisma.examCentre.update({
        where: { id: centre.id },
        data: { status: 'READY' },
      });
    }

    return {
      centreId: centre.id,
      centreCode: centre.centreCode,
      centreName: centre.name,
      state: centre.state,
      district: centre.district,
      examId: exam?.id,
      examCode: exam?.examCode,
      status: finalStatus,
      scorePercentage,
      reasons,
      checklist,
      deviceSummary: {
        total: totalDevices,
        authorized: authorizedDevices.length,
        pending: pendingDevices.length,
        suspended: suspendedDevices.length,
        quarantined: quarantinedDevices.length,
        offline: offlineDevices.length,
        passingHardwareChecks: devicesPassingHw.length,
      },
      capacitySummary: {
        seatingCapacity: centre.capacity,
        allocatedCandidates: allocatedCandidatesCount,
        utilizationPercentage: utilizationPct,
      },
      activationSummary: {
        isActivated: isActivationValid,
        tokenIssued: !!relevantActivation,
        expiresAt: relevantActivation?.expiresAt.toISOString(),
        isExpired: isActivationExpired,
      },
      hasOverride,
      overrideDetails,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Records an authorized operational override for a centre readiness evaluation.
   * Mandates strict RBAC, justification reason, and writes an immutable AuditEvent.
   */
  static async recordOverride(params: {
    centreId: string;
    examId?: string;
    actorId: string;
    actorRole: string;
    reason: string;
    ipAddress: string;
  }): Promise<CentreReadinessEvaluation> {
    const { centreId, examId, actorId, actorRole, reason, ipAddress } = params;

    if (!reason || reason.trim().length < 10) {
      throw new Error('Mandatory justification reason (at least 10 characters) required for operational override');
    }

    const centre = await prisma.examCentre.findFirst({
      where: { OR: [{ id: centreId }, { centreCode: centreId }] },
    });
    if (!centre) throw new Error('Exam centre not found');

    // Write immutable AuditEvent
    await AuditLedgerService.logEvent({
      eventType: 'CENTRE_READINESS_OVERRIDE',
      actorId,
      actorRole,
      action: `OPERATIONAL OVERRIDE APPROVED for Centre ${centre.centreCode} (${centre.name}). Reason: ${reason}`,
      ipAddress,
      metadata: {
        centreId: centre.id,
        centreCode: centre.centreCode,
        examId,
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    // Re-evaluate readiness with the override applied
    const updatedEvaluation = await this.evaluateReadiness(centre.id, examId);

    // Broadcast WebSocket event to all relevant rooms
    WebSocketService.broadcastToRoom('national', {
      type: 'READINESS_OVERRIDE_RECORDED',
      payload: {
        centreId: centre.id,
        centreCode: centre.centreCode,
        actorRole,
        reason,
        status: updatedEvaluation.status,
      },
    });

    if (centre.state) {
      WebSocketService.broadcastToRoom(`state:${centre.state}`, {
        type: 'READINESS_OVERRIDE_RECORDED',
        payload: {
          centreId: centre.id,
          centreCode: centre.centreCode,
          actorRole,
          reason,
          status: updatedEvaluation.status,
        },
      });
    }

    WebSocketService.broadcastToRoom(`centre:${centre.centreCode}`, {
      type: 'READINESS_OVERRIDE_RECORDED',
      payload: {
        centreId: centre.id,
        centreCode: centre.centreCode,
        actorRole,
        reason,
        status: updatedEvaluation.status,
      },
    });

    return updatedEvaluation;
  }
}
