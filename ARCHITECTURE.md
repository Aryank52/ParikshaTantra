# ParikshaTantra System Architecture

## Architecture Overview

```
[ Government Examination Authority ]
                │
                │ (Global Exam Release Event)
                ▼
      ┌──────────────────┐
      │  ParikshaTantra  │◄──────────── Cryptographic Question Vault (AES-256)
      │  Central Server  │◄──────────── 4-Eyes Dual Approval Workflow
      └────────┬─────────┘◄──────────── Tamper-Evident SHA-256 Audit Ledger
               │                        AI Insider Threat & Semantic Leak Engine
               │ (WebSocket Broadcast: EXAM_RELEASED)
               ▼
      ┌──────────────────┐
      │ Secure Centre    │ (Gateway Controller: Short-Lived HMAC Token Verification)
      │ Gateway / Node   │
      └────────┬─────────┘
               │ (JIT Encrypted Question Payload)
               ▼
      ┌──────────────────┐
      │ Candidate        │ (Sandboxed CBT Engine, Local Storage Encryption)
      │ CBT Terminals    │
      └──────────────────┘
```

---

## Technical Layers

### 1. Presentation & Multi-Portal Layer (`/client`)
- **Technology**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, WebSockets.
- **Portals**:
  - `/candidate`: CBT Exam Terminal, Lobby, Admit Card, Results.
  - `/authority`: Question Vault (AES-256 + 4-Eyes), Blueprint Engine, Global Exam Release.
  - `/state` & `/district`: Regional governance oversight panels.
  - `/centre`: Gateway Activation Token scanner/entry, Terminal Device Registry.
  - `/security`: SOC Operations Command Centre, Threat Matrix, Emergency Freeze controls.
  - `/auditor`: Hash-Chain Forensic Audit Verifier.

### 2. Security & Backend Application Layer (`/server`)
- **Technology**: Node.js, Express, TypeScript, Prisma ORM, WebSockets.
- **Security Services**:
  - `CryptoService`: AES-256-GCM question content encryption/decryption, HMAC-SHA256 activation token derivation, digital signature verification.
  - `AuditLedgerService`: Tamper-evident SHA-256 hash chaining ($H_n = \text{SHA256}(H_{n-1} + \text{payload})$).
  - `ThreatEngineService`: AI Insider threat anomaly evaluation (risk score 0–100).
  - `LeakDetectionService`: OCR simulation + n-gram TF-IDF cosine similarity search.
  - `WebSocketService`: Real-time incident & exam state broadcasting.

### 3. Data & Storage Layer
- **Relational Database**: PostgreSQL / SQLite via Prisma ORM.
- **In-Memory Cache**: Redis 7.
