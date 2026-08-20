# ParikshaTantra — Security Testing & Penetration Test Matrix

## 🛡️ Zero-Trust Verification Framework

ParikshaTantra includes a built-in **10-Scenario Attack Simulator** (`/simulator/run`, `AttackSimulatorView.tsx`) allowing security auditors to execute live penetration tests against the platform.

---

## 1. 10 Penetration Test Attack Scenarios

| Test ID | Scenario | Attack Vector Tested | Expected Defense Behavior | Result |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Unauthorized Vault Read | Candidate JWT requesting decrypted vault question | `403 Forbidden` - RBAC check blocks request | ✅ PASSED |
| **TEST-02** | Expired Activation Token | Using activation token past 15-minute window | `400 Bad Request` - Time window verification fails | ✅ PASSED |
| **TEST-03** | Unregistered Device JIT | Requesting JIT question payload from unauthorized MAC/IP | `401 Unauthorized` - Device registry lookup fails | ✅ PASSED |
| **TEST-04** | Bulk Question Scraping | Rapid 50+ question requests in 10 seconds | Threat Engine triggers `HIGH` risk score & session lock | ✅ PASSED |
| **TEST-05** | Audit Ledger Tampering | Modifying historical `previousHash` in database | Integrity verifier flags exact corrupted record index | ✅ PASSED |
| **TEST-06** | Leaked Screenshot Upload | Uploading leaked question text snippet | Leak Engine flags `CRITICAL` similarity match & question code | ✅ PASSED |
| **TEST-07** | Session Token Replay | Replaying candidate token on different terminal IP | Device mismatch detector blocks access & logs anomaly | ✅ PASSED |
| **TEST-08** | Unauthorized Result Publish| Attempting result publication without dual approval | `403 Forbidden` - 4-Eyes signature check fails | ✅ PASSED |
| **TEST-09** | Certificate Forgery | Submitting forged QR checksum to `/verify` | Verification engine returns `INVALID / FORGED` | ✅ PASSED |
| **TEST-10** | Emergency SOC Freeze | Triggering global emergency exam lock | WebSocket broadcasts `EXAM_FROZEN` to all CBT sessions | ✅ PASSED |

---

## 2. Automated Test Execution Command

```bash
# Execute Attack Simulator endpoints programmatically
cd server
npm run test:security
```
