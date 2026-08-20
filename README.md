# ParikshaTantra (परीक्षा तन्त्र)
## Secure Examination Lifecycle & CBT Infrastructure Operating System

![System Status](https://img.shields.io/badge/Security-ZERO--TRUST%20PROD-emerald?style=for-the-badge&logo=shield)
![Architecture](https://img.shields.io/badge/Architecture-Two--Portal%20Unified-blue?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Question%20Vault-AES--256--GCM-amber?style=for-the-badge)
![Audit](https://img.shields.io/badge/Audit%20Ledger-SHA--256%20Hash%20Chained-indigo?style=for-the-badge)
![AI Copilot](https://img.shields.io/badge/AI-Pariksha%20AI%20Copilot-teal?style=for-the-badge)

---

## 🏛️ Executive Summary

**ParikshaTantra** is a productized, zero-trust national examination operating system designed for central, state, and district examination authorities (e.g., UPSC, NTA, SSC, IBPS, and State PSCs).

It provides a complete end-to-end examination lifecycle organized around **Two Unified Product Portals**:

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

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v22.x or higher
- npm v10.x
- Docker & Docker Compose (Optional)

### Running Locally (Development)

```bash
# 1. Setup Backend & Seed Database
cd server
npm install
npx prisma db push
npx prisma generate
npx ts-node src/seed.ts
npm run dev

# 2. Setup Frontend (in a new terminal tab)
cd ../client
npm install
npx vite --port 3000
```

---

## 📋 Governance & Specifications

- [PHASE4_CURRENT_STATE.md](file:///e:/PROJECTS/ParikshaTantra/PHASE4_CURRENT_STATE.md) — Comprehensive Codebase Audit
- [SECRET_ROTATION_GUIDE.md](file:///e:/PROJECTS/ParikshaTantra/SECRET_ROTATION_GUIDE.md) — Secret Hygiene & SOP Key Rotation Guide
- [PHASE4_COMPLETION_REPORT.md](file:///e:/PROJECTS/ParikshaTantra/PHASE4_COMPLETION_REPORT.md) — Phase 4 Delivery & Productization Report
- [ARCHITECTURE.md](file:///e:/PROJECTS/ParikshaTantra/ARCHITECTURE.md) — Technical System Architecture
- [SECURITY.md](file:///e:/PROJECTS/ParikshaTantra/SECURITY.md) — Zero-Trust Security Specification
