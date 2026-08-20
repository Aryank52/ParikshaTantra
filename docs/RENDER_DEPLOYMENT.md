# ParikshaTantra — Render Backend Deployment Guide

> **Target Platform**: Render Cloud (Web Service)  
> **Backend Stack**: Node.js v22 + Express + TypeScript 5.6 + Prisma ORM + WebSockets (`ws`)  

---

## 🏛️ Executive Summary

The ParikshaTantra API server is prepared for deployment as a Web Service on **Render**.

---

## ⚙️ Configuration & Environment Setup

### 1. Web Service Build Settings
* **Environment**: `Node`
* **Root Directory**: `server`
* **Build Command**: `npm install && npx prisma generate && npm run build`
* **Start Command**: `npm start`

### 2. Environment Variables Configuration

```ini
NODE_ENV=production
PORT=10000

# Authentication & Cryptography
JWT_SECRET=PARIKSHATANTRA_ULTRA_SECURE_JWT_SECRET_2026_PROD_GRADE
AES_MASTER_KEY=a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90
HMAC_ACTIVATION_KEY=PARIKSHATANTRA_HMAC_ACTIVATION_SECRET_KEY_998877665544332211

# Supabase PostgreSQL Connection Pooler Strings
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# CORS & Storage Configuration
CORS_ALLOWED_ORIGINS="https://parikshatantra.vercel.app"
SUPABASE_URL="https://[REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
STORAGE_BUCKET="parikshatantra-vault"
```

---

## ⚡ Free-Tier Sleep & Reconnect Resilience

Render free-tier Web Services enter sleep mode after 15 minutes of inactivity:
- `index.ts` binds to `0.0.0.0` and listens dynamically on `process.env.PORT`.
- `RedisService` automatically degrades to in-memory Map caches if Redis drops during sleep/restarts.
- Frontend displays `RECONNECTING` or `DEGRADED` status badges during cold start awakenings without losing candidate exam state.
