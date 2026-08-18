# ParikshaTantra — Current State Repository Audit

## 🏛️ Executive Audit Summary

ParikshaTantra is an advanced, production-oriented zero-trust national examination operating system. This audit evaluates the current implementation state across frontend, backend, security cryptography, database models, and deployment infrastructure.

---

## 1. What Already Works

- **Public Examination Catalog (`/api/catalog`, `PublicExamCatalog.tsx`)**: Filterable, searchable catalog covering UPSC, NTA, SSC, IBPS, and 10+ State PSCs (MPSC, UPPSC, BPSC, WBPSC, KPSC, TSPSC, RPSC, MPPSC, TNPSC, GPSC).
- **5-Step Candidate Registration Wizard (`CandidateRegistrationModal.tsx`)**: Personal details, contact, education, eligibility verification, document metadata, category selection, and instant admit card node assignment.
- **Cryptographic Question Vaulting (`CryptoService.ts`, `vaultRoutes.ts`)**: AES-256-GCM symmetric encryption for question content with IV, authTag, and SHA-256 hash generation.
- **4-Eyes Dual Approval Workflow (`blueprintRoutes.ts`, `Question` model)**: Dual signing and review requirements for question vault items before exam inclusion.
- **Central Global Exam Release (`examLifecycleService.ts`, `examRoutes.ts`)**: Global exam status release generating short-lived, centre-specific derived activation tokens ($T_{\text{centre}} = \text{HMAC-SHA256}(K_{\text{secret}}, \text{ExamID} + \text{CentreID} + \text{TimeWindow})$).
- **Just-In-Time (JIT) Question Delivery (`jitRoutes.ts`)**: Session-authorized JIT delivery of decrypted questions exclusively during active CBT sessions.
- **Sandboxed CBT Terminal Interface (`CandidateCBT.tsx`)**: Question palette, section timer, answer state retention, clear response, review markers, and local storage buffer.
- **Tamper-Evident SHA-256 Audit Ledger (`auditLedgerService.ts`, `AuditView.tsx`)**: Hash-chained block integrity tracking with real-time hash recalculation verification.
- **10-Scenario Attack Simulator (`simulatorRoutes.ts`, `AttackSimulatorView.tsx`)**: Live penetration test execution verifying zero-trust defenses against expired tokens, unregistered devices, tampered logs, leaked screenshots, and forged certificates.
- **Public Certificate Verification (`PublicVerificationPortal.tsx`, `resultRoutes.ts`)**: QR-code verifiable public results with signed digital hashes.

---

## 2. What Partially Works

- **AI Insider Threat & Semantic Leak Engine (`leakDetectionService.ts`, `threatEngineService.ts`)**: Has working Jaccard/n-gram similarity and Gemini AI API integration, but lacks OCR image processing for raw screenshot uploads.
- **Offline CBT Local Sync**: Browser `localStorage` is used for buffering, but lacks IndexedDB service worker queue management and retry sequence tracking.
- **Centre Gateway Node**: Simulated as an Express API route rather than an edge proxy with local SQLite fallback.
- **Hardware & Device Health Check**: Basic browser capability detection exists, but lacks dedicated `/candidate/device-check` and `/centre/hardware-check` workflows.

---

## 3. What Is Simulated

- **Payment Gateways**: Application fee payments are simulated via auto-approval state rather than external payment abstraction (Razorpay/PayU).
- **OMR / Answer Sheet Scanning**: Paper exam mode sheets are simulated in demo mode.
- **Biometric Verification**: Candidate identity hashes are validated deterministically without real fingerprint/facial hardware devices.
- **External KMS / HSM**: Cryptographic master key is managed via environment variables rather than cloud KMS (AWS KMS / GCP KMS / HashiCorp Vault).

---

## 4. What Is Missing

- **Extensible Exam Catalog Admin Configuration**: Adding new exams currently requires manual Prisma seed or API endpoints; needs admin UI configuration.
- **Multimodal OCR Vision Pipeline**: Image file (JPG/PNG/PDF) OCR text extraction for leaked exam paper photos.
- **Merkle Tree Batching for Audit Ledger**: Linear SHA-256 chain exists; periodic 100-event Merkle Tree roots with proof paths are missing.
- **Bilingual & STEM Question Renderer**: KaTeX / MathML rendering for formulas, chemistry, and multi-language support (Hindi/English).
- **Forensic Micro-Watermarking**: Dynamic invisible/subtle steganographic provenance markers (`PROV-XXXXX`) embedded into CBT candidate interfaces.
- **Extensible Hardware Device Attestation Service**: Signed device heartbeat and attestation payload handling.

---

## 5. Security Gaps

- **Master Key Static Storage**: AES Master key stored in server `.env` rather than derived or KMS-managed key hierarchy.
- **Client-Side Secret Exposure Risk**: Need strict verification that no server secrets or Gemini keys leak to frontend bundles (Audit passed, but documented in `SECURITY_SECRETS.md`).
- **Absence of Rate Limiting Middleware**: Public catalog and candidate registration endpoints lack `express-rate-limit` guards against DDoS or scraping.
- **HMAC Signatures Instead of Asymmetric RSA/ECDSA**: Blueprint signing currently uses HMAC-SHA256 (`JWT_SECRET`) instead of true RSA-4096 / ECDSA P-256 private key signatures.

---

## 6. UX Gaps

- **Landing Page Clarity**: Needs clear messaging that ParikshaTantra is an open-source demonstration operating system, avoiding false claims of official government adoption.
- **Device & Sensor Permission Workflow**: Needs dedicated pre-exam camera, microphone, and browser capability diagnostic views (`/candidate/device-check`).
- **Dark Theme Contrast**: Some UI badges and terminal grid elements require improved contrast ratios for accessibility.

---

## 7. Backend Gaps

- **Lack of Structured Error Handling Middleware**: Uncaught route errors return standard Express HTML stack traces instead of standardized JSON error payloads.
- **Missing Multimodal File Upload Handlers**: Express routes currently expect JSON payloads rather than `multer` multipart file uploads for screenshots or candidate documents.

---

## 8. Database Gaps

- **SQLite Provider in Production**: Prisma schema uses SQLite (`dev.db`). Needs PostgreSQL compatibility configuration for high-concurrency production deployments.
- **Missing Merkle Batch Table**: Need `AuditMerkleBatch` model in Prisma schema for Merkle tree batching.

---

## 9. Deployment Gaps

- **Docker Compose Redis Integration**: `docker-compose.yml` does not spin up a Redis instance alongside the Node.js server.
- **Environment Variable Validation**: Missing strict startup validation ensuring `AES_MASTER_KEY` is 64 hex characters.

---

## 10. Recommended Implementation Order

1. **Phase 3.1: Security & Secrets Hardening** (`SECURITY_SECRETS.md`, Asymmetric Signing, HKDF Key Derivation).
2. **Phase 3.2: Database Model Extension** (Merkle Trees, Extensible Catalog, Paper Mode, Answer Sheets).
3. **Phase 3.3: Multimodal Vision OCR & Micro-Watermark Forensic Engine** (Multer upload, OCR pipeline, Provenance tracking).
4. **Phase 3.4: Sandboxed CBT Engine & Math/KaTeX Renderer** (Stem rendering, IndexedDB queue worker, camera/mic pre-check).
5. **Phase 3.5: Comprehensive Candidate & Centre Lifecycle Views** (Device Check, Extensible Catalog Admin, Paper Upload Desk).
6. **Phase 3.6: Audit Ledger Merkle Explorer & Verification Portal** (Merkle tree builder, proof paths).
7. **Phase 3.7: Documentation & System Audit Verification** (All required 18 markdown artifacts).
