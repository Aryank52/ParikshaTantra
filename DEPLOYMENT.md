# ParikshaTantra Production Deployment Guide

## Overview

ParikshaTantra is containerized using Docker Compose for simple, cloud-agnostic deployment across AWS, Azure, GCP, or private government clouds (NIC / MeghRaj).

---

## Architecture Topology

```
             ┌───────────────────────┐
             │   Reverse Proxy / WAF │ (Port 80/443)
             └───────────┬───────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
┌────────────────────┐      ┌────────────────────┐
│ Frontend Container │      │ Backend Container  │ (Port 5000)
│   (Nginx + React)  │      │  (Node / Express)  │
└────────────────────┘      └──────────┬─────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │  PostgreSQL Container │ (Port 5432) │    Redis Container    │ (Port 6379)
        └───────────────────────┘             └───────────────────────┘
```

---

## Deployment Steps

### 1. Environment Configuration
Create `.env` file in root:

```env
PORT=5000
DATABASE_URL=postgresql://pariksha_admin:SecurePassword2026!@postgres:5432/parikshatantra?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=PARIKSHATANTRA_ULTRA_SECURE_JWT_SECRET_2026_PROD_GRADE
AES_MASTER_KEY=a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90
HMAC_ACTIVATION_KEY=PARIKSHATANTRA_HMAC_ACTIVATION_SECRET_KEY_998877665544332211
```

### 2. Launch Services
```bash
docker-compose up -d --build
```

### 3. Verify Health
```bash
curl http://localhost:5000/api/health
```
