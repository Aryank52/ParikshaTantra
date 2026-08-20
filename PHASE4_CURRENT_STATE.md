# ParikshaTantra — Phase 4 Codebase Audit & System State

> **Audit Timestamp**: August 2026  
> **Auditor Role**: Principal Product Architect & Cybersecurity Lead  
> **Repository Baseline**: ParikshaTantra Full Stack (React 18 + Node.js/Express + Prisma ORM + WebSockets)

---

## 1. Functional Modules
These modules are structurally complete, fully routed, and contain active business logic:
* **Candidate Registration & 5-Step Wizard**: Registration, personal/educational detail validation, instant node allocation, and admit card issuing.
* **Exam Discovery & Catalog (`/api/catalog`)**: Multi-filter exam search covering UPSC, NTA, SSC, IBPS, and 10+ State PSCs with eligibility criteria.
* **Cryptographic Question Vault (`/api/vault`)**: AES-256-GCM symmetric encryption with IV, authentication tags, and SHA-256 canonical question hashes.
* **4-Eyes Dual Approval Workflow (`/api/blueprints`)**: Dual-signature review and approval rules before question inclusion in active blueprints.
* **Central Global Exam Release**: Short-lived derived HMAC activation token generation ($T_{\text{centre}}$) bound to exam ID, centre ID, and time window.
* **Sandboxed CBT Terminal Engine (`CandidateCBT.tsx`)**: Question palette, section timer, answer state retention, KaTeX formula rendering, and offline local storage buffer.
* **Tamper-Evident Merkle Audit Ledger (`/api/audit`)**: Hash-chained block integrity tracking with Merkle tree batch roots and $O(\log N)$ proof paths.
* **10-Scenario Attack Simulator (`/api/simulator`)**: Live REST execution testing defenses against expired tokens, tampered logs, forged certificates, and bulk question exports.
* **Public Certificate Verification (`/verify`)**: QR-code verifiable public results with signed digital hashes.

---

## 2. Working Modules
Modules that compile, run cleanly, and execute expected behaviors without errors:
* Express backend server (`server/src/index.ts`) on port 5000 with CORS and route handlers.
* React frontend application (`client/src/App.tsx`) with Vite bundler and Zustand global state management.
* Prisma database ORM (`schema.prisma`) with SQLite dev provider.
* WebSocket service (`websocketService.ts`) broadcasting live SOC security alerts and threat status updates.
* KaTeX math rendering component (`MathRenderer.tsx`) rendering LaTeX math expressions dynamically.

---

## 3. Partial Modules
Modules that exist but have incomplete workflows or missing UI/backend integrations:
* **AI Insider Threat & Semantic Leak Engine (`leakDetectionService.ts`)**: Contains Jaccard/TF-IDF text similarity and Gemini API hook, but lacks client-side image OCR file parsing for raw photo uploads.
* **Hardware & Sensor Diagnostic Check (`DeviceCheckView.tsx`)**: Displays camera/microphone stream previews, but lacks backend logging into `HardwareCheckLog` table.
* **Paper Exam Mode Desk (`AnswerSheetUploadView.tsx`)**: Accepts scanned OMR uploads and computes file hashes, but lacks automated bubble alignment evaluation.
* **Centre Gateway Node (`CentreGatewayView.tsx`)**: Interface exists in client views, but operates over central REST APIs rather than an isolated Edge Proxy node.

---

## 4. Mock / Simulated Modules
Modules relying on simulated behaviors or stubbed abstractions:
* **Payment Gateway**: Fee processing uses `SIMULATED_PAYMENT` state auto-approval.
* **Biometric Scanners**: Aadhaar/fingerprint checks use deterministic identity hashes (`identityHash`).
* **Cloud KMS / HSM**: Cryptographic key management derives from server `.env` variables rather than AWS KMS / GCP KMS.

---

## 5. Security Gaps
* **Symmetric HMAC Signatures**: Blueprint and Admit Card signing rely on HMAC with JWT secret instead of asymmetric RSA-4096 / ECDSA P-256 private keys.
* **Rate Limiting**: Public catalog and registration endpoints lack `express-rate-limit` guards against DDoS or brute-force requests.
* **Client-Side Provenance Watermark**: Watermark uses DOM-rendered text overlay (`PROV-XXXXX`), which tech-savvy candidates could hide via browser DevTools CSS modification.
* **Raw Gemini API Secret Exposure Risk**: Server `.env` contained a raw API key format that requires immediate rotation and strict env isolation.

---

## 6. UX Gaps
* **Single Unsplit Interface**: Student and Government features were mixed in a single navigation layout instead of two distinct, specialized portals.
* **Candidate Dashboard Layout**: Lacked an immediate "NEXT EXAM" focus card summarizing upcoming exam, shift, reporting time, seat node, and status.
* **Role-Aware AI Assistant**: Lacked an embedded, role-aware Pariksha AI copilot for candidates and administrators.

---

## 7. Backend Gaps
* **Central Error Middleware**: Route errors handle responses inconsistently instead of emitting standardized JSON error structures.
* **Multipart File Upload Handling**: Backend routes expect JSON payloads rather than `multer` multipart file uploads for screenshots/scans.

---

## 8. Database Gaps
* **SQLite Single-File Limitations**: Prisma schema uses SQLite (`dev.db`), restricting concurrent database writes during heavy load. Needs PostgreSQL dual-provider setup.
* **Database Indexes**: Lacks compound indexes on high-frequency search fields (`sessionToken`, `centreCode`, `candidateCode`).

---

## 9. AI Gaps
* **Lack of Offline OCR Fallback**: If Gemini API is unconfigured or unreachable, image leak detection cannot extract text from screenshot uploads.
* **Prompt Injection Protection**: AI assistant endpoints require strict input sanitization guards to prevent candidate prompt injection.

---

## 10. Deployment Gaps
* **Redis Missing in Docker Compose**: `docker-compose.yml` spins up Node server and React client, but omits Redis for session caching and rate-limiting.
* **CI/CD Pipeline**: Missing GitHub Actions workflow (`.github/workflows/ci.yml`) for automated linting, building, and container security scanning.

---

## 11. Duplicate Code
* Repeated mock candidate identity generation in `seed.ts` and `candidateRoutes.ts`.
* Redundant status badge styling across multiple views instead of a unified `StatusBadge` component.

---

## 12. Technical Debt
* Lack of automated unit/integration test suites (Vitest / Supertest).
* Hardcoded role strings in routes instead of strongly typed TypeScript role enums.

---

## 13. Recommended Implementation Sequence for Phase 4

1. **Secret Hardening & Rotation**: Sanitize `.env`, create `.env.example`, and document `SECRET_ROTATION_GUIDE.md`.
2. **Two-Portal Architecture**: Split navigation into **Student / Candidate Portal** and **Government / Administration Portal**.
3. **Candidate Dashboard Redesign**: Implement "NEXT EXAM" focal card, quick application status grid, and admit card shortcuts.
4. **Pariksha AI Assistant**: Build role-aware Candidate Assistant & Admin Operations Copilot with strict tool-calling authorization guards.
5. **Real Authentication & Role-Based Access Control**: Build dedicated student and government login views with seeded role accounts.
6. **Public Landing Page Upgrade**: Modernize `/` with complete feature discovery, exam search, status grid, and clear login entry points.
7. **Comprehensive System Documentation**: Update all 18+ markdown artifacts and create `PHASE4_COMPLETION_REPORT.md`.
