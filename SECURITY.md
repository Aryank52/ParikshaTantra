# ParikshaTantra Security Architecture & Policy

## Core Security Controls

### 1. Zero-Trust Authorization (RBAC)
- 12-Role Government Hierarchy: `SUPER_ADMIN`, `NATIONAL_AUTHORITY`, `STATE_AUTHORITY`, `DISTRICT_AUTHORITY`, `EXAM_CONTROLLER`, `QUESTION_REVIEWER`, `QUESTION_APPROVER`, `CENTRE_ADMIN`, `INVIGILATOR`, `SECURITY_OFFICER`, `AUDITOR`, `CANDIDATE`.
- Token-based JWT authentication with 8-hour expiry and refresh rotation.
- Role checks enforced strictly server-side. Client-supplied role claims are never trusted.

### 2. Cryptographic Question Vaulting
- Sensitive question content is encrypted at rest using **AES-256-GCM**.
- Key derivation uses high-entropy master secrets (`AES_MASTER_KEY`).
- Plaintext question content is decrypted only in memory during authorized JIT payload release.

### 3. 4-Eyes Dual Approval Workflow
- Critical operations (e.g. Question Vaulting, Exam Release, Result Publication) require mandatory signatures from two distinct authorized users (`Approver A` AND `Approver B`).
- Prevents rogue insider single-point compromise.

### 4. HMAC-SHA256 Short-Lived Centre Activation Tokens
- Mobile-phone OTP dependencies are eliminated for CBT activation.
- Central Exam Release derives unique, short-lived tokens per centre:
  $$T_{centre} = \text{HMAC-SHA256}(K_{secret}, ExamID + CentreID + TimeWindow)$$
- Validity window: 15 minutes. One-time consumption enforced.

### 5. Just-In-Time (JIT) Question Delivery
- Exam papers are NEVER distributed to centres days or hours in advance.
- Questions are decrypted and served to terminals only when:
  1. Central Exam is in `RELEASED` / `RUNNING` state.
  2. Centre Gateway is `ACTIVATED`.
  3. Terminal Device is `AUTHORIZED`.
  4. Candidate Session is active (`IN_PROGRESS`).

### 6. Tamper-Evident SHA-256 Audit Ledger
- All sensitive events append to an immutable cryptographic hash chain:
  $$H_n = \text{SHA256}(H_{n-1} \parallel \text{actorId} \parallel \text{eventType} \parallel \text{action} \parallel \text{timestamp})$$
- Continuous re-verification detects any direct database alteration.
