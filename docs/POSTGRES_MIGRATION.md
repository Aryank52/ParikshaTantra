# ParikshaTantra — PostgreSQL & Supabase Database Migration Guide

> **Database Protocol**: Production Relational Database Governance  
> **Canonical Engine**: PostgreSQL 15+ (Supabase Managed PostgreSQL / Local PostgreSQL)  
> **ORM Framework**: Prisma ORM v5+ with Dual Connection Pooler Support  

---

## 🏛️ Executive Summary

SQLite (`dev.db`) has been officially removed as the primary database provider for ParikshaTantra. The platform canonical database engine is now **PostgreSQL**.

For high-concurrency production deployments (e.g., Supabase / PgBouncer), Prisma is configured with dual connection strings:
1. `DATABASE_URL`: Transaction-mode connection pooler (`port 6543`) for fast non-blocking Express API runtime queries.
2. `DIRECT_DATABASE_URL`: Direct PostgreSQL connection (`port 5432`) used exclusively by Prisma CLI for DDL migrations (`prisma db push`, `prisma migrate`).

---

## 🛠️ Step-by-Step PostgreSQL Migration Protocol

### Step 1: Environment Variable Setup
Ensure `server/.env` contains the required PostgreSQL connection parameters:

```ini
# Supabase PostgreSQL (Production)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Local PostgreSQL (Development Alternative)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parikshatantra?schema=public"
# DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parikshatantra?schema=public"
```

### Step 2: Validate Prisma Schema & Generate Client
```bash
cd server

# 1. Validate Prisma schema compatibility with PostgreSQL
npx prisma validate

# 2. Generate Prisma Client bindings for PostgreSQL
npx prisma generate
```

### Step 3: DDL Migration Execution
```bash
# Push database schema to target PostgreSQL instance
npx prisma db push
```

### Step 4: Seed Database Master Records
```bash
# Execute idempotent database seed script
npx ts-node src/seed.ts
```

---

## 📊 Database Schema Topology & Compound Indexes

PostgreSQL schema models configured in `schema.prisma`:
* `Organization` (Central, State, District authorities)
* `User` (12-role RBAC permissions)
* `ExamCentre` (Capacity, geolocation, connectivity & security status)
* `RegisteredDevice` (Hardware hash attestation)
* `Candidate` (Cryptographic identity pseudonym hash `identityHash`)
* `Question` (AES-256-GCM cipher string, IV, authTag, SHA-256 canonical hash)
* `Exam` & `ExamBlueprint` (Subject/difficulty rules, signed checksum)
* `CentreActivation` (Short-lived derived HMAC center activation tokens $T_{centre}$)
* `CandidateSession` (JIT CBT terminal state, offline answer sync buffer)
* `Submission` (Encrypted answer payload, digital signatures, score evaluation)
* `AuditEvent` (SHA-256 hash-chained block integrity log)
* `AuditMerkleBatch` (100-event Merkle root batches with $O(\log N)$ proof paths)
* `SecurityEvent` & `LeakEvidence` (SOC threat telemetry & AI similarity matches)
* `Certificate` (QR-code verifiable digital certificates)

---

## 🔒 Verification Standard

- Zero SQLite single-file locks.
- Full transactional isolation across candidate submissions.
- Idempotent seed script (`src/seed.ts`) populates state master, district master, demo exam catalog, test centres, questions, candidate admit cards, and security threat logs cleanly.
