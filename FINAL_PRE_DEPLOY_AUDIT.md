# ParikshaTantra — Final Pre-Deployment Engineering Audit

> **Audit Timestamp**: August 2026  
> **Lead Role**: Principal Pre-Deployment Engineer & Security Architect  
> **Scope**: Pre-Deployment Hardening, Database Migration, Provider Abstractions, and Cloud Readiness  
> **Immediate Target Stack**: Frontend → Vercel | Backend → Render | Database → Supabase PostgreSQL | Storage → Supabase Storage  
> **Future Target Stack**: AWS (ECS/Fargate, RDS Aurora PostgreSQL, S3, ElastiCache, Secrets Manager, KMS)  

---

## 🏛️ Subsystem Classification Matrix

| Subsystem / Module | Implementation Type | Phase 5 Target Status | Deployment Action Required |
| :--- | :--- | :--- | :--- |
| **Relational Database** | SQLite (`dev.db`) | **POSTGRESQL (MIGRATED)** | Convert Prisma provider to `postgresql`, configure `DATABASE_URL` & `DIRECT_DATABASE_URL` for Supabase / PgBouncer. |
| **Object Storage** | Base64 DB Strings / Local Files | **SUPABASE STORAGE / S3** | Build `ObjectStorageService` abstraction supporting local file fallback and Supabase/S3 signed URLs. |
| **Cache & Queue Layer** | In-Memory / Local Arrays | **REDIS ABSTRACTION** | Build `RedisService` abstraction with graceful enabled/disabled fallback for free-tier resilience. |
| **AI Operations Engine** | Direct Gemini API Hook | **AI PROVIDER ABSTRACTION** | Build `AIProvider` abstraction with Gemini, Local Rules, and Mock providers with fallback error handling. |
| **Frontend Web App** | React 18 / Vite SPA | **VERCEL DEPLOYMENT** | Configure SPA rewrites (`vercel.json`), production environment variables (`VITE_API_URL`, `VITE_WS_URL`). |
| **Backend Express Server** | Node.js / Express | **RENDER DEPLOYMENT** | Listen on `0.0.0.0`, dynamic `process.env.PORT`, CORS allowed origins, multi-system `/api/health` check. |
| **Question Cryptography** | AES-256-GCM + HKDF | **PROD-HARDENED** | KMS abstraction ready; uses hex master keys derived from server env variables. |
| **Exam Activation Engine** | Short-Lived Derived HMAC ($T_{\text{centre}}$) | **PROD-READY** | Stateless HMAC center activation tokens with nonces, expiry, and zero OTP candidate dependence. |
| **Audit Ledger** | SHA-256 Hash Chain + Merkle Tree | **PROD-READY** | Linear hash chain + `AuditMerkleBatch` model with `AuditAnchorService` abstraction for TSA/blockchain. |
| **Attack Simulator** | 10 Live REST Scenarios | **PROD-READY** | Live penetration defense suite testing token expiry, tampered logs, forged certs, and unauthorized export. |

---

## 🗄️ Database Audit: Removing SQLite & Migrating to PostgreSQL

### Gaps in Current SQLite Implementation
1. **Concurrency Lock**: SQLite locks the database file on writes, causing bottlenecks during multi-candidate exam submissions.
2. **Missing Native Types & Schema Constraints**: PostgreSQL provides native enum casting, compound indexes, and strict FK cascade rules.
3. **Cloud Host Failure**: Free-tier cloud hosts (Render/Vercel) have ephemeral file systems; SQLite `dev.db` resets on container restart.

### PostgreSQL & Supabase Connection Pooling Strategy
* **Direct Database URL (`DIRECT_DATABASE_URL`)**: Port `5432` direct PostgreSQL connection string used exclusively by Prisma CLI for schema migrations (`prisma db push`, `prisma migrate`).
* **Pooled Database URL (`DATABASE_URL`)**: Port `6543` connection pooler string (PgBouncer in transaction mode) used by the active Express server for fast, non-blocking connection reuse.

---

## 📦 Storage Strategy: Removing Base64 DB Payloads

* **Current Defect**: Large Base64 inline strings in `LeakEvidence.imageBase64` and scanned OMR sheets inflate database table size and slow down query execution.
* **Target Architecture**: Build `ObjectStorageService` with:
  * Private bucket paths: `candidate-documents/`, `answer-sheets/`, `incident-evidence/`, `exam-assets/`, `certificates/`.
  * Signed temporary URLs (`getSignedUrl`) for secure document previews.
  * MIME validation, max file size guards (5MB), and SHA-256 payload hashing.

---

## ⚡ Redis & Resilience Strategy

* **In-Memory Fallback**: If `REDIS_URL` is omitted or Redis service drops during free-tier sleeping, `RedisService` silently degrades to local in-memory Map caches without crashing exam workflows.
* **Database as Truth**: All authoritative state (exams, sessions, answers, audit events, certs) is written synchronously to PostgreSQL. Redis is used *only* for volatile caching, rate limiting, and WebSocket pub/sub.

---

## 🛡️ Environment Variable & CORS Security Audit

* **Frontend Security**: Ensure `VITE_API_URL` and `VITE_WS_URL` are the *only* client env variables. Zero server secrets (`JWT_SECRET`, `AES_MASTER_KEY`, `DATABASE_URL`) exposed in Vite client builds.
* **CORS Origin Protection**: Replace `Access-Control-Allow-Origin: *` in production with explicit domain verification against `process.env.CORS_ALLOWED_ORIGINS`.

---

## 🗺️ Phased Pre-Deployment Execution Plan

```
[Phase A: PostgreSQL Migration] ──► [Phase B: Storage Abstraction] ──► [Phase C: Redis Abstraction]
 • Convert schema.prisma to postgresql  • Build ObjectStorageService         • Build RedisService with fallback
 • Add DATABASE_URL & DIRECT_URL      • Supabase Storage / Local fallback   • In-memory degradation mode
 • Generate & verify migrations       • File hashing & MIME validation      • Token bucket rate limiter

[Phase D: AI Abstraction] ───────► [Phase E: Deployment Configs] ──► [Phase F: E2E Verification]
 • Build AIProvider interface         • Add vercel.json SPA rewrites        • Run Vitest / Supertest suite
 • Gemini / Rule / Mock fallbacks     • Render 0.0.0.0 & PORT binding       • Deploy Vercel + Render + Supabase
 • AI rate limiting per IP/User       • Multi-component /api/health check   • Publish 11 Pre-Deploy Docs
```
