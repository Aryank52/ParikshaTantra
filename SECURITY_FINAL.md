# ParikshaTantra — Final Security Specification

> **Security Governance**: Zero-Trust, Defense-in-Depth, Production-Hardened Security  
> **Audited Modules**: Cryptography, Identity, Question Vault, SOC Telemetry, AI Safety, Audit Ledger  

---

## 🏛️ Executive Summary

ParikshaTantra enforces strict zero-trust security perimeters across candidate registration, question vaulting, centre activation, JIT delivery, CBT terminal execution, and audit logging.

---

## 🛡️ Core Security Architecture & Control Enforcement

1. **Question Vault Cryptography**: AES-256-GCM symmetric encryption with HKDF per-question key derivation. Questions are decrypted strictly in-memory during active CBT sessions.
2. **4-Eyes Dual Approval**: Question vault items require dual digital signatures (Approver A + Approver B) before inclusion in active blueprints.
3. **Stateless HMAC Center Activation ($T_{\text{centre}}$)**: Derived center activation tokens eliminate candidate mobile OTP dependencies and lock exam releases to authorized time windows and centre IDs.
4. **Tamper-Evident SHA-256 Block Hash Chain & Merkle Tree**: Every administrative and security action appends an immutable block event. 100-event Merkle Tree batches provide $O(\log N)$ proof paths for zero-trust third-party auditability.
5. **AI Safety & Prompt Protection**: AI Assistant endpoints sanitize prompts against injection attacks, enforce role-based access control (RBAC), and source answers strictly from verified database state.
6. **Object Storage Privacy**: All candidate photos, documents, and OMR answer sheets are stored in private buckets with short-lived signed URLs (`getSignedUrl`).
