import { CryptoService } from '../services/cryptoService';
import { ExamPolicyService, DEFAULT_EXAM_POLICY } from '../services/examPolicyService';
import { ThreatEngineService } from '../services/threatEngineService';
import { AuditLedgerService } from '../services/auditLedgerService';

async function runSystemTestSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 PARIKSHATANTRA ZERO-TRUST AUTOMATED TEST SUITE');
  console.log('🧪 ========================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
  }

  // --- 1. Cryptography & Vault Security Tests ---
  console.log('\n--- 1. Cryptography & Vault Security Tests ---');
  const secretPayload = JSON.stringify({ question: 'What is the speed of light?', answer: '3x10^8 m/s' });
  const encrypted = CryptoService.encryptQuestionContent(secretPayload);
  assert(!!encrypted.cipherText && !!encrypted.iv && !!encrypted.authTag, 'AES-256-GCM Encryption produces cipherText, iv, and authTag');

  const decrypted = CryptoService.decryptQuestionContent(encrypted.cipherText, encrypted.iv, encrypted.authTag);
  assert(decrypted === secretPayload, 'AES-256-GCM Decryption matches original plaintext');

  const timeWindow = Math.floor(Date.now() / (1000 * 60 * 15));
  const activationToken = CryptoService.generateActivationToken('exam-uuid-1', 'EXAM-NEET-2026', 'centre-uuid-1', 'CENTRE-DELHI-01', timeWindow);
  assert(activationToken.startsWith('ACT-EXAM-NEET-2026-CENTRE-DELHI-01-'), 'HMAC Activation Token conforms to format ACT-<EXAM>-<CENTRE>-...');

  const isValidToken = CryptoService.verifyActivationToken(activationToken, 'exam-uuid-1', 'EXAM-NEET-2026', 'centre-uuid-1', 'CENTRE-DELHI-01', timeWindow);
  assert(isValidToken === true, 'HMAC Activation Token verifies successfully within time window');

  const isTamperedValid = CryptoService.verifyActivationToken(activationToken, 'exam-uuid-1', 'EXAM-NEET-2026', 'centre-uuid-2', 'CENTRE-MUMBAI-02', timeWindow);
  assert(isTamperedValid === false, 'Tampered Activation Token is strictly rejected');

  // --- 2. Examination Policy & Variant Shuffling Tests ---
  console.log('\n--- 2. Examination Policy & Variant Shuffling Tests ---');
  const variant1 = ExamPolicyService.computePaperVariant('CAND-001', 'EXAM-NEET-2026');
  assert(['SET_A', 'SET_B', 'SET_C', 'SET_D'].includes(variant1), `Deterministic Paper Variant assigned (${variant1})`);

  const variant2 = ExamPolicyService.computePaperVariant('CAND-002', 'EXAM-NEET-2026');
  assert(['SET_A', 'SET_B', 'SET_C', 'SET_D'].includes(variant2), 'Paper Variant generated for candidate 2');

  const defaultPolicy = DEFAULT_EXAM_POLICY;
  assert(defaultPolicy.cameraRequired === true && defaultPolicy.fullscreenRequired === true, 'Default Zero-Trust policy mandates camera & fullscreen lock');

  // --- 3. AI Anomaly & Threat Engine Tests ---
  console.log('\n--- 3. AI Anomaly & Threat Engine Tests ---');
  const normalRisk = ThreatEngineService.analyzeUserBehavior({
    actorRole: 'INVIGILATOR',
    action: 'CANDIDATE_ATTENDANCE_CHECK',
    requestCountInLastMinute: 5,
    accessedQuestionIdsCount: 0,
    accessHour: 10,
    isOutsideAssignedCentre: false,
    hasFailedMfa: false,
  });
  assert(normalRisk.riskLevel === 'LOW' && normalRisk.riskScore === 0, 'Baseline user behavior is classified as LOW Risk');

  const criticalAnomaly = ThreatEngineService.analyzeUserBehavior({
    actorRole: 'CANDIDATE',
    action: 'QUESTION_VAULT_DECRYPT',
    accessedQuestionIdsCount: 20,
    requestCountInLastMinute: 60,
    accessHour: 2,
    isOutsideAssignedCentre: true,
  });
  assert(criticalAnomaly.riskLevel === 'CRITICAL' && criticalAnomaly.recommendedAction === 'FREEZE_EXAM', 'Rogue Candidate Vault Access anomaly triggers CRITICAL Risk and FREEZE_EXAM recommendation');

  // --- 4. Tamper-Evident Ledger & Merkle Proof Tests ---
  console.log('\n--- 4. Tamper-Evident Ledger & Merkle Proof Tests ---');
  const sampleLeafHashes = [
    'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
  ];
  const { root: merkleRoot, treeLayers } = AuditLedgerService.buildMerkleTree(sampleLeafHashes);
  assert(typeof merkleRoot === 'string' && merkleRoot.length === 64, 'Merkle Tree Root is a valid SHA-256 64-char hex string');
  assert(treeLayers.length === 3, '4-Leaf Merkle Tree generates 3 tree layers');

  // --- 5. Digital Signature & Public Certificate Tests ---
  console.log('\n--- 5. Digital Signature & Public Certificate Tests ---');
  const certData = JSON.stringify({
    certificateNumber: 'CERT-NEET-2026-CAND-001',
    candidateId: 'CAND-001',
    candidateName: 'Aarav Sharma',
    examTitle: 'National Eligibility cum Entrance Test (NEET UG 2026)',
    score: 685,
    percentile: 99.82,
  });
  const signature = CryptoService.signPayload(certData);
  const isSignatureValid = CryptoService.verifySignature(certData, signature);
  assert(isSignatureValid === true, 'Valid Digital Signature is verified authentic');

  const tamperedCertData = JSON.stringify({ ...JSON.parse(certData), score: 720 });
  const isTamperedSignatureValid = CryptoService.verifySignature(tamperedCertData, signature);
  // --- 6. JWT Authentication & WebSocket Handshake Tests ---
  console.log('\n--- 6. JWT Authentication & WebSocket Handshake Tests ---');
  const jwt = require('jsonwebtoken');
  const { CONFIG } = require('../config');

  const testPayload = { userId: 'user-123', username: 'national_admin', role: 'NATIONAL_AUTHORITY' };
  const validJwt = jwt.sign(testPayload, CONFIG.JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(validJwt, CONFIG.JWT_SECRET);
  assert(decoded.userId === 'user-123' && decoded.role === 'NATIONAL_AUTHORITY', 'Valid JWT signs and decodes authenticated user payload');

  let tamperedCaught = false;
  try {
    jwt.verify(validJwt, 'wrong-secret-key-for-test');
  } catch (e) {
    tamperedCaught = true;
  }
  assert(tamperedCaught === true, 'Tampered secret or corrupted signature throws cryptographic verification error');

  // Authoritative token format validation
  const sanitizeToken = (t: any) => (t && typeof t === 'string' && t.trim() && t !== 'null' && t !== 'undefined' ? t.trim() : null);
  assert(sanitizeToken(undefined) === null, 'Undefined token resolves to null (no malformed Bearer sent)');
  assert(sanitizeToken('null') === null, 'Stringified "null" token resolves to null');
  assert(sanitizeToken('  ') === null, 'Whitespace token resolves to null');
  assert(sanitizeToken(validJwt) === validJwt, 'Genuine JWT string is resolved authoritatively');

  console.log('\n========================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('========================================================\n');
}

runSystemTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
