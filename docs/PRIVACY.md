# ParikshaTantra — Privacy & Candidate Data Protection Notice

## 🛡️ Privacy Principles & Compliance

ParikshaTantra is built with strict **Privacy-by-Design** principles. We treat candidate personal identifiable information (PII) and diagnostic sensor data with zero-trust security controls.

---

## 1. Data Collection & Purpose Scoping

| Data Element | Purpose | Storage & Isolation | Retention |
| :--- | :--- | :--- | :--- |
| **Govt ID / Aadhaar Hash** | Identity verification | Irreversible SHA-256 pseudonymized digest. Raw ID is never stored. | Duration of examination cycle |
| **Candidate Photo / Biometrics** | Admit card & seat check | Encrypted storage, accessible only via short-lived signed URLs. | 90 days post result publication |
| **Webcam Feed / Camera Diagnostics** | Pre-exam hardware test & movement signal | Browser frame sampling. **No continuous raw video retention.** | 72 hours post exam completion |
| **Microphone Hardware Test** | Pre-exam audio diagnostic | Hardware volume check only. **Audio recording disabled by default.** | Instantaneous (In-Memory) |
| **CBT Answers & Digests** | Exam evaluation | AES-256 encrypted storage + SHA-256 audit ledger hash chain. | Permanent audit record |

---

## 2. Dynamic Invisible Forensic Watermarking

To prevent paper leaks without exposing candidate PII:
- Provenance tokens (`PROV-7F28A91C`) are opaque 8-character hex hashes.
- The visible watermark does NOT display candidate names, phone numbers, or email addresses.
- Mapping between `PROV-7F28A91C` and candidate seat nodes is restricted to authorized SOC forensic investigators.

---

## 3. Public Certificate & Verification Privacy

Public verification at `/verify` returns **minimal public verification information**:
- Candidate Pseudonymized Roll Number
- Examination Title & Year
- Qualification Status (PASSED/VERIFIED)
- Certificate Hash

Raw scores, subject breakdown, and personal demographic details are excluded from public QR endpoints.
