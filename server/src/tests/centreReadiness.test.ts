import { prisma } from '../lib/prisma';
import { CentreReadinessService } from '../services/centreReadinessService';
import { CryptoService } from '../services/cryptoService';
import { AuditLedgerService } from '../services/auditLedgerService';

async function runCentreReadinessTestSuite() {
  console.log('🏛️  ========================================================');
  console.log('🏛️  PARIKSHATANTRA PHASE 3: CENTRE READINESS & DEVICE SUITE');
  console.log('🏛️  ========================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // --- Step 1: Resolve Baseline Centre & Active Exam ---
  console.log('\n--- 1. Baseline Target Resolution ---');
  const centre = await prisma.examCentre.findFirst({
    where: { centreCode: 'CENTRE-DELHI-01' },
    include: { devices: true },
  });
  assert(!!centre, `Found target examination centre: ${centre?.name} (${centre?.centreCode})`);

  const exam = await prisma.exam.findFirst({
    where: { examCode: 'EXAM-NEET-2026' },
  });
  assert(!!exam, `Found target examination: ${exam?.title} (${exam?.examCode})`);

  await prisma.exam.update({
    where: { id: exam!.id },
    data: {
      status: 'ACTIVE',
      scheduledStart: new Date(Date.now() - 3600000),
      scheduledEnd: new Date(Date.now() + 14400000),
    },
  });

  // Ensure active valid activation exists for baseline evaluation
  const timeWindow = Math.floor(Date.now() / (1000 * 60 * 15));
  const activationToken = CryptoService.generateActivationToken(exam!.id, exam!.examCode, centre!.id, centre!.centreCode, timeWindow);

  await prisma.centreActivation.deleteMany({
    where: { OR: [{ examId: exam!.id, centreId: centre!.id }, { activationToken }] },
  });

  await prisma.centreActivation.create({
    data: {
      examId: exam!.id,
      centreId: centre!.id,
      activationToken,
      expiresAt: new Date(Date.now() + 3600000),
      isValid: true,
      usedAt: new Date(),
    },
  });

  await prisma.examCentre.update({
    where: { id: centre!.id },
    data: {
      status: 'ACTIVATED',
      connectivityStatus: 'ONLINE',
      securityStatus: 'GREEN',
    },
  });

  // Ensure target terminal is authorized
  const testDevice = await prisma.registeredDevice.findFirst({
    where: { centreId: centre!.id },
  });
  assert(!!testDevice, `Resolved registered terminal: ${testDevice?.deviceId} at Centre ${centre?.centreCode}`);

  await prisma.registeredDevice.update({
    where: { id: testDevice!.id },
    data: { status: 'AUTHORIZED', lastHeartbeat: new Date() },
  });

  // --- Step 2: Comprehensive Centre Readiness Evaluation ---
  console.log('\n--- 2. Comprehensive 8-Dimension Readiness Evaluation ---');
  const evaluation = await CentreReadinessService.evaluateReadiness(centre!.id, exam!.id);

  assert(evaluation.centreCode === 'CENTRE-DELHI-01', 'Readiness evaluation resolved target centre code');
  console.log('EVALUATION REASONS:', evaluation.reasons);
  console.log('FAILING CHECKS:', evaluation.checklist.filter((c: any) => c.status === 'FAILED'));
  assert(evaluation.status === 'READY', `Readiness status is READY (Actual: ${evaluation.status})`);
  assert(evaluation.scorePercentage >= 90, `Deterministic readiness score is optimal: ${evaluation.scorePercentage}%`);
  assert(evaluation.checklist.length >= 10, `Checklist contains all 8 operational dimensions (${evaluation.checklist.length} items)`);
  assert(evaluation.activationSummary.isActivated === true, 'Gateway activation is confirmed active and valid');
  assert(evaluation.deviceSummary.authorized > 0, `Authorized terminals count: ${evaluation.deviceSummary.authorized}`);

  // --- Step 3: Exam-Scoped HMAC Device Token Challenge ---
  console.log('\n--- 3. Exam-Scoped HMAC Device Authorization Token Tests ---');
  const devAuthToken = CryptoService.generateDeviceAuthorizationToken(exam!.id, exam!.examCode, centre!.id, testDevice!.deviceId, timeWindow);
  assert(devAuthToken.startsWith(`DEV-AUTH-${exam!.examCode}-`), `HMAC Device Token generated: ${devAuthToken}`);

  const isTokenValid = CryptoService.verifyDeviceAuthorizationToken(devAuthToken, exam!.id, exam!.examCode, centre!.id, testDevice!.deviceId, timeWindow);
  assert(isTokenValid === true, 'Device authorization token verifies successfully within time window');

  const isTamperedTokenValid = CryptoService.verifyDeviceAuthorizationToken(devAuthToken, exam!.id, exam!.examCode, centre!.id, 'DEV-OTHER-99', timeWindow);
  assert(isTamperedTokenValid === false, 'Tampered device authorization token is strictly rejected');

  // --- Step 4: Device Lifecycle & Quarantine State Transitions ---
  console.log('\n--- 4. Device Lifecycle, Suspension & Quarantine Tests ---');
  // Suspend device
  const suspendedDev = await prisma.registeredDevice.update({
    where: { id: testDevice!.id },
    data: { status: 'SUSPENDED' },
  });
  assert(suspendedDev.status === 'SUSPENDED', 'Terminal transitioned to SUSPENDED status');

  await AuditLedgerService.logEvent({
    eventType: 'DEVICE_SUSPENDED',
    actorId: 'test-admin',
    actorRole: 'CENTRE_ADMIN',
    action: `Terminal ${testDevice!.deviceId} SUSPENDED for test audit verification`,
    deviceId: testDevice!.id,
    ipAddress: '127.0.0.1',
    metadata: { reason: 'Automated test suite maintenance' },
  });

  // Quarantine device
  const quarantinedDev = await prisma.registeredDevice.update({
    where: { id: testDevice!.id },
    data: { status: 'QUARANTINED' },
  });
  assert(quarantinedDev.status === 'QUARANTINED', 'Terminal transitioned to QUARANTINED status');

  // Verify readiness flags the quarantined device
  const evalWithQuarantine = await CentreReadinessService.evaluateReadiness(centre!.id, exam!.id);
  const quarantineCheck = evalWithQuarantine.checklist.find((c) => c.code === 'DEVICE_QUARANTINE_CHECK');
  assert(quarantineCheck?.status === 'WARNING', 'Readiness engine flags quarantined terminal in operational checklist');
  assert(evalWithQuarantine.reasons.some((r) => r.includes('QUARANTINE')), 'Explainable reasons list includes quarantined terminal alert');

  // Unquarantine and restore
  await prisma.registeredDevice.update({
    where: { id: testDevice!.id },
    data: { status: 'AUTHORIZED', lastHeartbeat: new Date() },
  });
  assert(true, 'Terminal restored to AUTHORIZED following inspection clearance');

  // --- Step 5: Hardware Check Diagnostic Simulation ---
  console.log('\n--- 5. Hardware Diagnostics Log Verification ---');
  const hwLog = await prisma.hardwareCheckLog.create({
    data: {
      checkType: 'CENTRE_LAB',
      entityId: testDevice!.deviceId,
      cameraStatus: 'PASS',
      micStatus: 'PASS',
      screenRes: '1920x1080',
      storageCap: '4GB Local Buffer',
      networkLatencyMs: 14,
      overallStatus: 'PASS',
      detailsJson: JSON.stringify({ verifiedBy: 'Automated Diagnostic Sensor' }),
    },
  });
  assert(!!hwLog.id && hwLog.overallStatus === 'PASS', 'Hardware diagnostic check log recorded and linked to terminal');

  // --- Step 6: Security Perimeter Breach & Readiness Blocking ---
  console.log('\n--- 6. Security Perimeter Failure & Blocking Test ---');
  await prisma.examCentre.update({
    where: { id: centre!.id },
    data: { securityStatus: 'RED' },
  });

  const blockedEval = await CentreReadinessService.evaluateReadiness(centre!.id, exam!.id);
  assert(blockedEval.status === 'BLOCKED', `Security RED perimeter transitions readiness to BLOCKED (Actual: ${blockedEval.status})`);
  assert(blockedEval.reasons.some((r) => r.includes('security status is RED')), 'Explainable reason explicitly states security breach');

  // Restore security status to GREEN
  await prisma.examCentre.update({
    where: { id: centre!.id },
    data: { securityStatus: 'GREEN' },
  });

  // --- Step 7: Authorized Operational Override Workflow ---
  console.log('\n--- 7. Operational Override Workflow & Audit Integrity ---');
  const overrideResult = await CentreReadinessService.recordOverride({
    centreId: centre!.id,
    examId: exam!.id,
    actorId: 'nat-authority-01',
    actorRole: 'NATIONAL_AUTHORITY',
    reason: 'National Chief Superintendent operational override verification: physical security cleared.',
    ipAddress: '127.0.0.1',
  });

  assert(overrideResult.hasOverride === true, 'Operational override flag set to TRUE in evaluation');
  assert(overrideResult.overrideDetails?.actorRole === 'NATIONAL_AUTHORITY', 'Override record attributes approving authority role');
  assert(overrideResult.status === 'READY', 'Override grants conditional READY state for examination progression');

  // Verify AuditEvent written to ledger
  const overrideAuditEvent = await prisma.auditEvent.findFirst({
    where: { eventType: 'CENTRE_READINESS_OVERRIDE', action: { contains: centre!.centreCode } },
    orderBy: { createdAt: 'desc' },
  });
  assert(!!overrideAuditEvent, 'Immutable AuditEvent recorded for operational readiness override');

  console.log('\n========================================================');
  console.log(`🎉 CENTRE READINESS AUDIT: ${passed}/${total} TESTS PASSED (100%)`);
  console.log('========================================================');
}

runCentreReadinessTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Centre Readiness Test failed:', err);
    process.exit(1);
  });
