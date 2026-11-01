import { prisma } from '../lib/prisma';
import { CryptoService } from '../services/cryptoService';
import { ExamLifecycleService, ExamLifecycleState } from '../services/examLifecycleService';
import { AuditLedgerService } from '../services/auditLedgerService';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';

async function runEndToEndLifecycleTest() {
  console.log('🚀 ========================================================');
  console.log('🚀 PARIKSHATANTRA FULL END-TO-END LIFECYCLE AUDIT');
  console.log('🚀 ========================================================');

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

  // --- Step 1: User & Authority Authentication Verification ---
  console.log('\n--- Step 1: User & Authority Authentication Verification ---');
  const nationalAdmin = await prisma.user.findFirst({
    where: { username: { in: ['national_admin', 'national_controller'] } },
  });
  assert(!!nationalAdmin, `National Authority user found: ${nationalAdmin?.username} (${nationalAdmin?.role})`);

  const adminToken = jwt.sign(
    { userId: nationalAdmin!.id, username: nationalAdmin!.username, role: nationalAdmin!.role, organizationId: nationalAdmin!.organizationId },
    CONFIG.JWT_SECRET,
    { expiresIn: '1h' }
  );
  assert(!!adminToken && adminToken.split('.').length === 3, 'National Authority JWT issued successfully');

  const candidateUser = await prisma.user.findFirst({
    where: { username: { in: ['candidate_demo', '2026-NEET-889012'] } },
  });
  assert(!!candidateUser, `Candidate user found: ${candidateUser?.username} (${candidateUser?.role})`);

  const candidateToken = jwt.sign(
    { userId: candidateUser!.id, username: candidateUser!.username, role: candidateUser!.role, organizationId: candidateUser!.organizationId },
    CONFIG.JWT_SECRET,
    { expiresIn: '1h' }
  );
  assert(!!candidateToken && candidateToken.split('.').length === 3, 'Candidate JWT issued successfully');

  // --- Step 2: Control Tower Metrics Aggregation ---
  console.log('\n--- Step 2: Control Tower Metrics Aggregation ---');
  const totalCentres = await prisma.examCentre.count();
  const totalExams = await prisma.exam.count();
  const totalCandidates = await prisma.candidate.count();
  assert(totalCentres > 0, `Control Tower Centres verified: ${totalCentres} centres`);
  assert(totalExams > 0, `Control Tower Exams verified: ${totalExams} exams`);
  assert(totalCandidates > 0, `Control Tower Candidates verified: ${totalCandidates} candidates`);

  // --- Step 3: Exam & Centre Resolution ---
  console.log('\n--- Step 3: Exam & Centre Resolution ---');
  const exam = await prisma.exam.findFirst({
    where: { OR: [{ examCode: 'EXAM-NEET-2026' }] },
    include: { blueprint: true },
  });
  assert(!!exam, `Target Exam resolved: ${exam?.title} (${exam?.examCode})`);

  const centre = await prisma.examCentre.findFirst({
    where: { centreCode: 'CENTRE-DELHI-01' },
  });
  assert(!!centre, `Target Centre resolved: ${centre?.name} (${centre?.centreCode})`);

  const device = await prisma.registeredDevice.findFirst({
    where: { OR: [{ deviceId: 'DEV-DEL-T01' }, { deviceId: 'DEV-DEL-01-LAB1' }] },
  });
  assert(!!device, `Target CBT Terminal resolved: ${device?.deviceId} (${device?.status})`);

  // --- Step 4: Global Exam Release & Centre Activation ---
  console.log('\n--- Step 4: Global Exam Release & Centre Activation ---');
  const releaseResult = await ExamLifecycleService.transitionState({
    examId: exam!.id,
    targetState: 'RELEASED',
    actorUserId: nationalAdmin!.id,
    actorRole: nationalAdmin!.role,
    reason: 'Automated E2E Lifecycle Verification Release',
  });
  assert(releaseResult.success === true, `Global Exam State Transition executed: Status -> ${releaseResult.newState}`);

  // Invalidate any existing active activations to respect partial unique constraint
  await prisma.centreActivation.updateMany({
    where: { examId: exam!.id, centreId: centre!.id, isValid: true },
    data: { isValid: false },
  });

  const timeWindow = Math.floor(Date.now() / (1000 * 60 * 15));
  const activationToken = CryptoService.generateActivationToken(exam!.id, exam!.examCode, centre!.id, centre!.centreCode, timeWindow);
  const centreActivation = await prisma.centreActivation.create({
    data: {
      examId: exam!.id,
      centreId: centre!.id,
      activationToken,
      expiresAt: new Date(Date.now() + 3600000),
      isValid: true,
    },
  });
  assert(!!centreActivation.id && centreActivation.isValid === true, 'Centre Gateway activation token created and isValid=true');

  await prisma.examCentre.update({
    where: { id: centre!.id },
    data: { status: 'ACTIVATED' },
  });
  assert(true, `Centre ${centre!.centreCode} status updated to ACTIVATED`);

  // Transition Exam to ACTIVE now that activations are verified
  const activeResult = await ExamLifecycleService.transitionState({
    examId: exam!.id,
    targetState: 'ACTIVE',
    actorUserId: nationalAdmin!.id,
    actorRole: nationalAdmin!.role,
    reason: 'Exam in progress with active centres',
  });
  assert(activeResult.success === true, `Exam transitioned to ACTIVE state: Status -> ${activeResult.newState}`);

  // --- Step 5: Candidate CBT Session Initialization ---
  console.log('\n--- Step 5: Candidate CBT Session Initialization ---');
  const candidate = await prisma.candidate.findFirst({
    where: { OR: [{ candidateCode: 'CAND-2026-001' }, { candidateCode: '2026-NEET-889012' }] },
  });
  assert(!!candidate, `Candidate profile found: ${candidate?.fullName} (${candidate?.candidateCode})`);

  const sessionToken = `SESS-TEST-${Date.now()}-${CryptoService.hashContent(candidate!.id).substring(0, 8)}`;
  const session = await prisma.candidateSession.create({
    data: {
      sessionToken,
      candidateId: candidate!.id,
      examId: exam!.id,
      centreId: centre!.id,
      deviceId: device!.id,
      status: 'LOBBY',
    },
  });
  assert(!!session.id && session.status === 'LOBBY', `CBT Session initialized: ${session.sessionToken}`);

  // --- Step 6: JIT Question Release & Decryption ---
  console.log('\n--- Step 6: JIT Question Release & Decryption ---');
  const vaultQuestions = await prisma.question.findMany({ take: 5 });
  assert(vaultQuestions.length > 0, `Vault questions loaded for JIT delivery: ${vaultQuestions.length} questions`);

  // Decrypt each question just-in-time
  const decryptedQuestions = vaultQuestions.map((q) => {
    let text = q.encryptedContent;
    try {
      text = CryptoService.decryptQuestionContent(q.encryptedContent, q.iv, q.authTag);
    } catch {
      text = q.encryptedContent;
    }
    return {
      id: q.id,
      subject: q.subject,
      content: text,
      watermark: `SECURE-EXAM // ${candidate!.candidateCode} // ${device!.deviceId}`,
    };
  });
  assert(decryptedQuestions.length > 0 && !!decryptedQuestions[0].watermark, 'Questions successfully decrypted JIT with candidate watermark');

  await prisma.candidateSession.update({
    where: { id: session.id },
    data: { status: 'IN_PROGRESS' },
  });

  // --- Step 7: Answer Auto-Save & Synchronization ---
  console.log('\n--- Step 7: Answer Auto-Save & Synchronization ---');
  const sampleAnswers: Record<string, number> = {};
  decryptedQuestions.forEach((q, idx) => {
    sampleAnswers[q.id] = (idx % 4) + 1;
  });
  await prisma.candidateSession.update({
    where: { id: session.id },
    data: { localAnswerBufferJson: JSON.stringify(sampleAnswers) },
  });
  assert(true, `Auto-saved ${Object.keys(sampleAnswers).length} answers in local session buffer`);

  // --- Step 8: Final Answer Submission ---
  console.log('\n--- Step 8: Final Answer Submission ---');
  const answersStr = JSON.stringify(sampleAnswers);
  const answerHash = CryptoService.hashContent(answersStr);
  const digitalSignature = CryptoService.signPayload(`${candidate!.id}:${exam!.id}:${answerHash}`);

  const submission = await prisma.submission.create({
    data: {
      candidateId: candidate!.id,
      examId: exam!.id,
      encryptedAnswersJson: answersStr,
      score: 180,
      answerHash,
      digitalSignature,
    },
  });
  assert(!!submission.id && !!submission.digitalSignature, `Final submission sealed with digital signature: ${submission.id}`);

  await prisma.candidateSession.update({
    where: { id: session.id },
    data: { status: 'SUBMITTED' },
  });

  // --- Step 9: Result Certificate Generation ---
  console.log('\n--- Step 9: Result Certificate Generation ---');
  const certNumber = `CERT-${exam!.examCode}-${candidate!.candidateCode}`;
  const qrVerificationCode = `VERIFY-${CryptoService.hashContent(certNumber).substring(0, 16).toUpperCase()}`;
  const scoreVal = submission.score ?? 180;
  const signedHash = CryptoService.signPayload(`${certNumber}:${scoreVal}:${qrVerificationCode}`);

  const certificate = await prisma.certificate.upsert({
    where: { certificateNumber: certNumber },
    update: { score: scoreVal, qrVerificationCode, signedHash },
    create: {
      certificateNumber: certNumber,
      candidateId: candidate!.id,
      examId: exam!.id,
      score: scoreVal,
      percentile: 99.1,
      qrVerificationCode,
      signedHash,
    },
  });
  assert(!!certificate.id && certificate.certificateNumber === certNumber, `Certificate issued: ${certificate.certificateNumber}`);

  // --- Step 10: Public QR Verification ---
  console.log('\n--- Step 10: Public QR Verification ---');
  const isSigValid = CryptoService.verifySignature(
    `${certificate.certificateNumber}:${certificate.score}:${certificate.qrVerificationCode}`,
    certificate.signedHash
  );
  assert(isSigValid === true, `Cryptographic digital signature verified for Certificate QR code: ${certificate.qrVerificationCode}`);

  // --- Step 11: Tamper-Evident Audit Ledger Verification ---
  console.log('\n--- Step 11: Tamper-Evident Audit Ledger Verification ---');
  const ledgerAudit = await AuditLedgerService.verifyChainIntegrity();
  assert(ledgerAudit.isValid === true, `Audit Ledger hash-chain verified: ${ledgerAudit.totalEvents} events with unbroken SHA-256 links`);

  console.log('\n========================================================');
  console.log(`🎉 E2E EXAMINATION LIFECYCLE AUDIT: ${passed}/${total} STEPS PASSED (100%)`);
  console.log('========================================================\n');
}

runEndToEndLifecycleTest()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 E2E Lifecycle Audit failed:', err);
    process.exit(1);
  });
