# ParikshaTantra — CI/CD Pipeline & GitHub Actions Setup Guide

> **CI Engine**: GitHub Actions (`.github/workflows/ci.yml`)  
> **Automation**: Dependabot (`.github/dependabot.yml`)  
> **Target Branches**: `main`, `master`, `develop`  
> **Database Protocol**: Disposable PostgreSQL CI Container (`postgres:16-alpine`)  

---

## 🏛️ Executive Summary

ParikshaTantra utilizes an automated **GitHub Actions CI/CD Pipeline** to validate pull requests and commits across 5 distinct workflow jobs:
1. `frontend`: React 18 / Vite compilation & TypeScript typecheck.
2. `backend`: Express API compilation & Prisma Client generation.
3. `database`: Ephemeral PostgreSQL container (`postgres:16-alpine`) running schema validation, DDL migration push, and database seed execution.
4. `security`: High-severity dependency security audit (`npm audit`).
5. `docker`: Multi-stage Dockerfile build verification for `./client` and `./server`.

---

## ⚡ GitHub Actions Workflow Jobs Architecture

```
                               ┌───────────────────────────────┐
                               │    Push / Pull Request        │
                               └───────────────┬───────────────┘
                                               │
    ┌──────────────────┬───────────────────────┼───────────────────────┬──────────────────┐
    ▼                  ▼                       ▼                       ▼                  ▼
┌──────────────┐ ┌──────────────┐   ┌─────────────────────┐   ┌──────────────┐   ┌──────────────┐
│   frontend   │ │   backend    │   │      database       │   │   security   │   │    docker    │
│ - Node 22    │ │ - Node 22    │   │ - Postgres 16       │   │ - npm audit  │   │ - Docker     │
│ - npm ci     │ │ - npm ci     │   │ - DATABASE_URL      │   │              │   │   build      │
│ - typecheck  │ │ - Prisma gen │   │ - DIRECT_DB_URL     │   └──────────────┘   └──────────────┘
│ - Vite build │ │ - tsc build  │   │ - Prisma validate   │
└──────────────┘ └──────────────┘   │ - Prisma db push    │
                                    │ - Seed execution    │
                                    └─────────────────────┘
```

---

## 🛠️ Environment Variable & PostgreSQL CI Configuration

For the `database` job, GitHub Actions provisions a temporary, disposable PostgreSQL 16 container (`postgres:16-alpine`).

Both `DATABASE_URL` and `DIRECT_DATABASE_URL` are explicitly set under job `env:`:

```yaml
env:
  DATABASE_URL: "postgresql://pariksha_ci:pariksha_ci@localhost:5432/pariksha_ci?schema=public"
  DIRECT_DATABASE_URL: "postgresql://pariksha_ci:pariksha_ci@localhost:5432/pariksha_ci?schema=public"
  JWT_SECRET: "PARIKSHATANTRA_ULTRA_SECURE_JWT_SECRET_2026_PROD_GRADE"
  AES_MASTER_KEY: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90"
  HMAC_ACTIVATION_KEY: "PARIKSHATANTRA_HMAC_ACTIVATION_SECRET_KEY_998877665544332211"
```

---

## 🔒 Recommended GitHub Branch Protection Settings

Once all jobs pass, set the following required status checks in GitHub Repository Settings:
- `Frontend (React / Vite) Build & Verification`
- `Backend (Express / TypeScript) Build & Verification`
- `PostgreSQL & Prisma Database Migration Validation`
- `Dependency Security & Secret Audit`
- `Docker Container Build Verification`
