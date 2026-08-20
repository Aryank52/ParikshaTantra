# ParikshaTantra — CI/CD Pipeline & GitHub Actions Setup Guide

> **CI Engine**: GitHub Actions (`.github/workflows/ci.yml`)  
> **Automation**: Dependabot (`.github/dependabot.yml`)  
> **Target Branches**: `main`, `master`, `develop`  

---

## 🏛️ Executive Summary

ParikshaTantra utilizes an automated **GitHub Actions CI/CD Pipeline** to validate pull requests and commits. The pipeline executes 5 parallel/sequential jobs ensuring frontend TypeScript compilation, backend Express build, ephemeral PostgreSQL database migration & seeding, security dependency scanning, and Docker container verification.

---

## ⚡ GitHub Actions Workflow Jobs Matrix

```
                      ┌───────────────────────────────┐
                      │    Push / Pull Request        │
                      └───────────────┬───────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   frontend-ci    │        │    backend-ci    │        │   database-ci    │
│  - Node 22 setup │        │  - Node 22 setup │        │  - Postgres 16   │
│  - npm ci        │        │  - npm ci        │        │  - Prisma push   │
│  - typecheck     │        │  - Prisma gen    │        │  - Seed verify   │
│  - Vite build    │        │  - tsc build     │        └──────────────────┘
└────────┬─────────┘        └──────────────────┘
         │
         ▼
┌──────────────────┐        ┌──────────────────┐
│   security-ci    │        │    docker-ci     │
│  - npm audit     │        │  - docker build  │
└──────────────────┘        └──────────────────┘
```

---

## 🛠️ Step-by-Step CI Job Definitions

### 1. `frontend-ci`
- **Environment**: Ubuntu Latest / Node.js v22
- **Steps**: Checkout code, install dependencies (`npm ci`), run typecheck (`tsc --noEmit`), build Vite application (`npm run build`), and upload `dist/` bundle artifact.

### 2. `backend-ci`
- **Environment**: Ubuntu Latest / Node.js v22
- **Steps**: Checkout code, install dependencies (`npm ci`), generate Prisma client (`npx prisma generate`), run typecheck (`tsc --noEmit`), and compile TypeScript backend (`npm run build`).

### 3. `database-ci`
- **Service Container**: `postgres:16-alpine` running on port 5432 with health check (`pg_isready`).
- **Steps**: Validate Prisma schema (`npx prisma validate`), push DDL schema migration (`npx prisma db push`), and verify master data seed execution (`npx ts-node src/seed.ts`).

### 4. `security-ci`
- **Steps**: Run high-severity dependency security audits (`npm audit --audit-level=high`) for both frontend and backend projects.

### 5. `docker-ci`
- **Steps**: Verify Docker container image builds for `./client` and `./server` Dockerfiles.

---

## 💻 Running Equivalent Commands Locally

Before submitting a Pull Request, developers can execute local equivalents from the root workspace:

```bash
# 1. Run workspace typechecks
npm run typecheck

# 2. Build both frontend and backend
npm run build

# 3. Validate PostgreSQL Prisma schema
npm run prisma:validate

# 4. Verify local Docker containers
docker-compose build
```
