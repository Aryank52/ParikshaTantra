# ParikshaTantra (परीक्षा तन्त्र)
## Secure Examination Lifecycle & CBT Infrastructure Operating System

![CI/CD Pipeline](https://img.shields.io/github/actions/workflow/status/Aryank52/ParikshaTantra/ci.yml?branch=main&style=for-the-badge&logo=github-actions&label=CI/CD%20Pipeline)
![System Status](https://img.shields.io/badge/Security-ZERO--TRUST%20PROD-emerald?style=for-the-badge&logo=shield)
![Architecture](https://img.shields.io/badge/Architecture-Two--Portal%20Unified-blue?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20Prisma-indigo?style=for-the-badge)
![AI Copilot](https://img.shields.io/badge/AI-Pariksha%20AI%20Copilot-teal?style=for-the-badge)

---

## 🏛️ Executive Summary

**ParikshaTantra** is a productized zero-trust national examination operating system designed for central, state, and district examination authorities (e.g., UPSC, NTA, SSC, IBPS, and State PSCs).

It provides a complete end-to-end examination security lifecycle organized around **Two Unified Product Portals**:

### 1. 🎓 Student / Candidate Portal
- **Redesigned Candidate Dashboard**: Immediate "NEXT EXAM" focus card showing exam title, shift, date, reporting time, allocated test centre, admit card status, and terminal seat node (`Terminal Node 14B`).
- **Pseudonymized Candidate Profile**: Secure identity record (`identityHash`) protecting candidate identity details while tracking allocated admit cards and category details.
- **Hardware System Pre-Check**: 5-point diagnostic test evaluating camera stream, microphone level, display resolution, and low latency network connectivity.
- **Sandboxed CBT Terminal**: KaTeX math rendering, section navigation, local storage backup, and JIT decrypted question delivery.
- **Pariksha AI Student Assistant**: Embedded role-aware AI assistant helping candidates with application tracking, admit card instructions, hardware checks, and exam rules.

### 2. 🏛️ Government / Administration Portal
- **Exam Day Control Tower**: Real-time operational command telemetry across live exams, centre status, active terminals, and network connectivity.
- **Question Vaulting & 4-Eyes Governance**: AES-256-GCM encryption with mandatory dual approver digital signatures before question inclusion in blueprints.
- **Centre Activation Engine**: Short-lived derived HMAC center activation tokens ($T_{centre} = \text{HMAC-SHA256}(K_{secret}, ExamID + CentreID + TimeWindow)$).
- **Security Operations Centre (SOC)**: Interactive GIS threat markers, statistical risk scoring, and emergency freeze controls (Global/Centre/Terminal/Session).
- **Tamper-Evident Merkle Audit Ledger**: Block hash chaining with Merkle tree batch roots and $O(\log N)$ proof paths.
- **Pariksha AI Operations Copilot**: Administrative AI copilot analyzing centre readiness, threat telemetry, audit Merkle roots, and activation tokens.

---

## 🏷️ System Maturity Classification

| System Component | Classification | Description |
| :--- | :---: | :--- |
| **Two-Portal User Interface** | **DEPLOYMENT READY** | Complete React 18 / Vite SPA for Candidate & Government personas. |
| **Express API Engine** | **DEPLOYMENT READY** | Node.js v22 Express API with mounted security routes & WebSockets. |
| **Relational Database** | **DEPLOYMENT READY** | PostgreSQL Prisma ORM with connection pooling compatibility. |
| **Zero-Trust Vaulting** | **DEPLOYMENT READY** | AES-256-GCM + HKDF per-question key derivation & 4-Eyes signatures. |
| **National Exam Catalog** | **REFERENCE / DEMO** | 15+ Central & State PSC reference entries with dataset badges. |
| **Payment Gateways** | **SIMULATED** | Fee processing abstraction using auto-approval demo state. |
| **Biometric Scanners** | **SIMULATED** | Pseudonymized identity hashes validated deterministically. |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v22.x or higher
- npm v10.x
- Docker & Docker Compose (Optional)

### Running Locally (Monorepo Workspace)

```bash
# 1. Install root, backend, and frontend dependencies
npm install

# 2. Setup Backend & PostgreSQL Database
cd server
npm install
npx prisma generate
npx prisma db push
npx ts-node src/seed.ts
npm run dev

# 3. Setup Frontend (in a new terminal tab)
cd ../client
npm install
npm run dev
```

### Workspace Commands (Root Directory)
```bash
# Build both frontend and backend
npm run build

# Run typechecks across workspace
npm run typecheck

# Validate PostgreSQL Prisma schema
npm run prisma:validate
```

---

## 📋 Governance & Deployment Specifications

- [FINAL_REPOSITORY_AUDIT.md](file:///e:/PROJECTS/ParikshaTantra/FINAL_REPOSITORY_AUDIT.md) — Final Repository Packaging Audit
- [CI_CD_SETUP.md](file:///e:/PROJECTS/ParikshaTantra/CI_CD_SETUP.md) — GitHub Actions CI/CD Pipeline Specification
- [POSTGRES_MIGRATION.md](file:///e:/PROJECTS/ParikshaTantra/POSTGRES_MIGRATION.md) — PostgreSQL & Supabase Database Migration Guide
- [VERCEL_DEPLOYMENT.md](file:///e:/PROJECTS/ParikshaTantra/VERCEL_DEPLOYMENT.md) — Vercel Static Frontend Deployment Guide
- [RENDER_DEPLOYMENT.md](file:///e:/PROJECTS/ParikshaTantra/RENDER_DEPLOYMENT.md) — Render Node.js Backend Deployment Guide
- [SECURITY_FINAL.md](file:///e:/PROJECTS/ParikshaTantra/SECURITY_FINAL.md) — Production Zero-Trust Security Specification
- [CONTRIBUTING.md](file:///e:/PROJECTS/ParikshaTantra/CONTRIBUTING.md) — Contribution Guidelines
- [LICENSE](file:///e:/PROJECTS/ParikshaTantra/LICENSE) — Apache License 2.0
