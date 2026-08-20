# ParikshaTantra — GitHub Actions CI Failure Root Cause & Resolution Report

> **Target Workflow**: `.github/workflows/ci.yml`  
> **Failing Step**: `Verify Backend & PostgreSQL Schema`  
> **Error Code**: `P1012 Environment variable not found: DIRECT_DATABASE_URL`  
> **Resolution**: Explicitly defined `DATABASE_URL` and `DIRECT_DATABASE_URL` environment variables in GitHub Actions workflow jobs for the disposable PostgreSQL CI service container.  

---

## 🔍 1. Root Cause Technical Analysis

### The Failure Mechanism
In `server/prisma/schema.prisma`, the datasource is declared as:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

Prisma ORM 5+ evaluates both `env("DATABASE_URL")` and `env("DIRECT_DATABASE_URL")` during:
1. `npx prisma validate`
2. `npx prisma generate`
3. `npx prisma db push`

In GitHub Actions runner environments (`ubuntu-latest`):
- Local environment files (`.env`) are excluded from Git tracking by `.gitignore`.
- When the backend/database job executed `npx prisma validate`, the process environment lacked `DIRECT_DATABASE_URL`.
- Prisma parser immediately aborted with error code `P1012`:
  ```
  Environment variable not found: DIRECT_DATABASE_URL
  ```

---

## 🛠️ 2. Correct Solution Implemented

### Principle: CI Environment Specification (Zero Code / Schema Mutation)
Rather than removing `directUrl` from `schema.prisma` or mutating working application logic, the GitHub Actions workflow environment was updated to supply both `DATABASE_URL` and `DIRECT_DATABASE_URL` to the disposable PostgreSQL CI service container (`postgres:16-alpine`).

```yaml
jobs:
  database:
    name: PostgreSQL & Prisma Database Migration Validation
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: "postgresql://pariksha_ci:pariksha_ci@localhost:5432/pariksha_ci?schema=public"
      DIRECT_DATABASE_URL: "postgresql://pariksha_ci:pariksha_ci@localhost:5432/pariksha_ci?schema=public"
      JWT_SECRET: "PARIKSHATANTRA_ULTRA_SECURE_JWT_SECRET_2026_PROD_GRADE"
      AES_MASTER_KEY: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90"
      HMAC_ACTIVATION_KEY: "PARIKSHATANTRA_HMAC_ACTIVATION_SECRET_KEY_998877665544332211"

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: pariksha_ci
          POSTGRES_USER: pariksha_ci
          POSTGRES_PASSWORD: pariksha_ci
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U pariksha_ci -d pariksha_ci"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
```

---

## 📊 3. Verification & Results

1. **`npx prisma validate`**: PASS (100% PostgreSQL schema syntax valid).
2. **`npx prisma generate`**: PASS (Prisma Client JS generated cleanly).
3. **`npx prisma db push`**: PASS (DDL tables created on disposable `postgres:16-alpine` CI instance).
4. **`npx ts-node src/seed.ts`**: PASS (Master state/district records and catalog seed executed cleanly).
5. **No Production Credentials**: Disposable container credentials (`pariksha_ci`) are strictly isolated to GitHub Actions runner memory.
