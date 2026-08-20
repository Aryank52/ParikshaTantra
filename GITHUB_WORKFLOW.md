# ParikshaTantra — GitHub Branch Protection & PR Workflow

> **Repository Governance Protocol**: Branch Protection & Continuous Integration  
> **Target Branches**: `main` (Production Ready) & `develop` (Integration Branch)  

---

## 🏛️ Recommended GitHub Branch Protection Rules

For high-integrity security, the following branch protection settings should be configured on the GitHub Repository Settings for `main`:

1. **Require Pull Request Before Merging**:
   - Require minimum 1 approval review.
   - Dismiss stale pull request approvals when new commits are pushed.
2. **Require Status Checks to Pass Before Merging**:
   - `frontend-ci` (Frontend Vite Build & Typecheck)
   - `backend-ci` (Backend Express Build & Typecheck)
   - `database-ci` (PostgreSQL Prisma Migration & DB Seed)
   - `security-ci` (High Severity Dependency Audit)
   - `docker-ci` (Docker Container Verification)
3. **Block Direct Force Pushes**:
   - Enforce linear commit history.
   - Prevent force pushes (`git push --force`) to `main`.

---

## 🚀 Development Branching Workflow

```
main (Production Deployable)
  ▲
  │ (Pull Request + Passing CI)
develop (Integration Testing)
  ▲
  ├── feature/candidate-portal-enhancements
  ├── feature/audit-merkle-explorer
  └── fix/cbt-reconnect-sync
```
