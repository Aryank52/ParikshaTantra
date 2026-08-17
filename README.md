# ParikshaTantra (परीक्षा तन्त्र)
## Secure National Examination & Anti-Leak Infrastructure

![System Status](https://img.shields.io/badge/Security-ZERO--TRUST%20PROD-emerald?style=for-the-badge&logo=shield)
![Architecture](https://img.shields.io/badge/Architecture-Defense--in--Depth-blue?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Question%20Vault-AES--256--GCM-amber?style=for-the-badge)
![Audit](https://img.shields.io/badge/Audit%20Ledger-SHA--256%20Hash%20Chained-indigo?style=for-the-badge)

---

## 🏛️ Executive Summary

**ParikshaTantra** is a zero-trust, defense-in-depth, production-oriented national examination security operating system designed for central, state, and district examination authorities.

Unlike standard quiz platforms, ParikshaTantra safeguards the complete **examination security lifecycle**:
- **Question Creation & Vaulting**: AES-256-GCM symmetric encryption with mandatory **4-Eyes Dual Approval**.
- **Exam Activation (Core Innovation #1)**: Central Global Exam Release generating short-lived, centre-specific derived activation tokens ($T_{centre} = \text{HMAC-SHA256}(K_{secret}, ExamID + CentreID + TimeWindow)$), eliminating candidate mobile-phone OTP dependencies.
- **Just-In-Time Question Release (Core Innovation #2)**: Encrypted question payloads are released ONLY to sandboxed terminals during active, authorized candidate CBT sessions.
- **Offline Resilience**: Local encrypted answer buffering with sequence numbers and retry queues prevents data loss during temporary network drops.
- **Security Operations Centre (SOC)**: Real-time map view, dynamic threat matrix, and Emergency Global/Centre/Device/Session Freeze controls.
- **AI Anomaly & Leak Detection**: Statistical insider threat risk scoring (0–100) and TF-IDF cosine similarity search against uploaded leaked snippets.
- **Tamper-Evident Forensic Audit Ledger**: Continuous SHA-256 block hash chaining with real-time recalculation integrity verification.
- **Public Certificate Verification**: QR-code verifiable certificates signed via RSA/HMAC digests.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v22.x or higher
- npm v10.x
- Docker & Docker Compose (Optional for containerized run)

### Running Locally (Development)

```bash
# Clone repository
git clone https://github.com/parikshatantra/parikshatantra.git
cd ParikshaTantra

# 1. Setup Backend
cd server
npm install
npx prisma db push
npm run dev

# 2. Setup Frontend (in a new terminal tab)
cd ../client
npm install
npx vite --port 3000
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **WebSocket Endpoint**: `ws://localhost:5000/ws`

### Containerized Deployment (Docker Compose)

```bash
docker-compose up -d --build
```

---

## 🔐 Zero-Trust Security Principles

1. **"Never Trust, Always Verify"**: Every API call evaluates JWT identity, 12-role RBAC permissions, tenant boundaries, device authorization, and time windows.
2. **Defense in Depth**: Multiple security perimeters (AES-256 vaulting, 4-Eyes signatures, HMAC token derivation, JIT delivery, SOC freeze enforcers).
3. **Fail Secure**: Any network drop or security anomaly defaults to local evidence preservation and session lock.
