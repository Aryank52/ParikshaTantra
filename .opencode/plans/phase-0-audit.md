# Phase 0: Audit & Stabilization Plan

**Objective:** Complete security hardening, architectural stabilization, and production readiness for ParikshaTantra examination platform before feature development.

**Duration:** 2-3 weeks  
**Team:** 2-3 engineers (1 backend, 1 frontend, 1 DevOps/security)

---

## Exact Modules Affected

### Backend (Server)
1. **Authentication & Authorization**
   - `server/src/config.ts` - Remove default secrets
   - `server/src/middleware/authMiddleware.ts` - Add org-scoping, rate limiting
   - `server/src/routes/authRoutes.ts` - Add token revocation, login rate limiting
   - `server/src/services/redisService.ts` - Apply to routes

2. **Database & Prisma**
   - `server/prisma/schema.prisma` - Add indexes, soft deletes
   - All route files - Use singleton PrismaClient
   - `server/src/seed.ts` - Separate demo/prod seeds

3. **WebSocket Service**
   - `server/src/services/websocketService.ts` - Heartbeat, reconnection, presence

4. **Security Services**
   - `server/src/services/auditLedgerService.ts` - External anchoring prep
   - `server/src/services/threatEngineService.ts` - Webhook triggers for auto-freeze

5. **API Routes** (apply rate limiting, validation)
   - All route files in `server/src/routes/`

### Frontend (Client)
1. **API Layer**
   - `client/src/services/api.ts` - AbortController, request deduping, React Query prep

2. **Auth & WebSocket**
   - `client/src/context/AuthContext.tsx` - WS reconnection, silent re-auth

3. **Error Handling**
   - New: `client/src/components/ErrorBoundary.tsx`
   - All views - Standardized loading/empty/error states

4. **Performance**
   - All views - Memoization, code splitting, bundle analysis

### Database
- Migration for indexes, soft deletes, new fields (MFA, revocation, etc.)

### Deployment
- `docker-compose.yml` - Remove hardcoded secrets
- `.github/workflows/ci.yml` - Add deployment jobs, migration review
- Render/Vercel - Health checks, secret rotation

---

## Dependencies

| Task | Depends On |
|------|------------|
| Prisma Singleton | None (do first) |
| Remove Default Secrets | None (do first) |
| Rate Limiting | RedisService, Prisma Singleton |
| Token Revocation | Rate Limiting, Redis |
| Org-Scoping Middleware | Prisma Singleton |
| WebSocket Heartbeat | None |
| WebSocket Reconnection | WS Heartbeat |
| Database Indexes | Schema changes |
| Soft Deletes | Schema changes |
| Frontend Error Boundaries | None |
| React Query Migration | API Client fixes |
| CI/CD Deploy Jobs | All tests passing |
| Monitoring Setup | Health endpoints |

---

## Implementation Sequence

### Week 1: Critical Security & Architecture (Days 1-5)

#### Day 1: Secrets & Prisma Singleton
- [ ] Remove default secrets from `config.ts` - require env vars
- [ ] Create `server/src/lib/prisma.ts` singleton
- [ ] Update all route files to import shared PrismaClient
- [ ] Verify no regression in CI

#### Day 2: Rate Limiting & Auth Hardening
- [ ] Apply `RedisService.checkRateLimit` to `/api/auth/login` (5 req/min)
- [ ] Apply rate limiting to all write endpoints (60 req/min)
- [ ] Add token revocation list in Redis (logout, password change)
- [ ] Add `revokedAt` to User model, check in `authenticateJwt`
- [ ] Add login attempt logging + account lockout after 5 failures

#### Day 3: Organization Scoping & CORS
- [ ] Add `enforceOrgScope` middleware for cross-org protection
- [ ] Fix CORS permissive fallback in `index.ts:55`
- [ ] Add security headers middleware (CSP, HSTS already present)

#### Day 4: WebSocket Hardening
- [ ] Add ping/pong heartbeat (30s interval)
- [ ] Track connection timestamps, cleanup stale (>2min)
- [ ] Add connection presence events (JOIN/LEAVE)
- [ ] Frontend: exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s)

#### Day 5: Database Indexes & Migration Prep
- [ ] Add indexes to `schema.prisma`:
  - `User.organizationId`
  - `Exam.organizationId`, `Exam.status`, `Exam.scheduledStart`
  - `ExamCentre.organizationId`, `ExamCentre.status`
  - `Candidate.allocatedCentreId`, `Candidate.candidateCode`
  - `CandidateSession.examId`, `CandidateSession.centreId`, `CandidateSession.status`
  - `Submission.examId`, `Submission.candidateId`
  - `AuditEvent.createdAt`, `AuditEvent.actorId`
  - `SecurityEvent.centreId`, `SecurityEvent.severity`, `SecurityEvent.status`
- [ ] Generate migration file (not `db push`)
- [ ] Test migration on staging

### Week 2: Frontend Stabilization & Database (Days 6-10)

#### Day 6: Frontend Error Boundaries & API Client
- [ ] Create `ErrorBoundary` component with fallback UI
- [ ] Wrap App routes in error boundaries
- [ ] Add AbortController to `fetchApi` for cancellation
- [ ] Add request deduplication (in-flight cache)

#### Day 7: React Query Migration (Phase 1)
- [ ] Install `@tanstack/react-query`
- [ ] Create QueryClient provider in App
- [ ] Migrate `AuthContext` user fetch to `useQuery`
- [ ] Migrate one dashboard view as pilot

#### Day 8: Loading/Empty/Error States Standardization
- [ ] Create `Skeleton`, `EmptyState`, `ErrorState` components
- [ ] Apply to all views (CandidateDashboard, AuthorityPortal, etc.)
- [ ] Add consistent toast/notification system

#### Day 9: Database Soft Deletes & MFA Fields
- [ ] Add `deletedAt` to: User, Exam, ExamCentre, Candidate, Question, Certificate
- [ ] Add `mfaSecret`, `mfaBackupCodes`, `mfaEnabled` to User
- [ ] Add `revokedAt` to User for token revocation
- [ ] Generate and test migration

#### Day 10: WebSocket Reconnection & Offline Flag
- [ ] Frontend: Implement WS reconnection with state resume
- [ ] Backend: Issue short-lived WS resume tokens
- [ ] CandidateCBT: Enhance offline mode with IndexedDB queue

### Week 3: Deployment, Monitoring & Validation (Days 11-15)

#### Day 11: CI/CD Deployment Pipeline
- [ ] Add Render deploy job (on main branch)
- [ ] Add Vercel deploy job (on main branch)
- [ ] Add migration review gate (manual approval)
- [ ] Add smoke tests post-deploy

#### Day 12: Monitoring & Observability
- [ ] Add `/api/metrics` endpoint (Prometheus format)
- [ ] Add structured logging (JSON, correlation IDs)
- [ ] Configure Render metrics, Vercel analytics
- [ ] Add alerting on: error rate > 1%, WS disconnects > 10%, DB pool exhaustion

#### Day 13: Backup/DR Validation
- [ ] Verify Supabase automated backups enabled
- [ ] Test point-in-time recovery procedure
- [ ] Document RPO/RTO targets

#### Day 14: Security Audit & Penetration Testing
- [ ] Run OWASP ZAP scan on staging
- [ ] Review all auth endpoints for enumeration
- [ ] Verify JWT secret rotation procedure
- [ ] Test emergency freeze end-to-end

#### Day 15: Definition of Done Verification
- [ ] All Phase 0 tasks complete
- [ ] CI passes with 0 critical/high vulnerabilities
- [ ] Load test: 1000 concurrent WS connections
- [ ] Load test: 500 concurrent CBT sessions
- [ ] Documentation updated

---

## Tests Required

### Unit Tests (Backend)
- [ ] `authMiddleware.test.ts` - JWT verify, role check, org scope
- [ ] `cryptoService.test.ts` - Encrypt/decrypt, HMAC, HKDF, signatures
- [ ] `examLifecycleService.test.ts` - All state transitions, prerequisites
- [ ] `threatEngineService.test.ts` - All 6 rules, edge cases
- [ ] `auditLedgerService.test.ts` - Hash chain, Merkle tree, verification

### Integration Tests (Backend)
- [ ] `auth.integration.test.ts` - Login, me, logout, revocation
- [ ] `exam.integration.test.ts` - Create, blueprint, release, activate, transition
- [ ] `cbt.integration.test.ts` - Start session, JIT, autosave, submit, score
- [ ] `soc.integration.test.ts` - Freeze scopes, event logging, WS broadcast

### Frontend Tests
- [ ] `AuthContext.test.tsx` - Login, logout, token refresh, WS connect
- [ ] `api.test.ts` - Fetch wrapper, auth header, 401 handling, cancellation
- [ ] Component tests for critical views (CandidateCBT, AuthorityPortal)

### E2E Tests (Playwright/Cypress)
- [ ] Candidate: Register → Admit Card → Login → CBT → Submit → Verify Certificate
- [ ] Authority: Create Exam → Blueprint → Global Release → Centre Activate
- [ ] SOC: Trigger Freeze → Verify WS Broadcast → Verify Session Frozen

### Load Tests (k6/Artillery)
- [ ] 1000 concurrent WS connections, 30s duration
- [ ] 500 concurrent CBT answer submissions, 60s duration
- [ ] 100 concurrent exam release activations

---

## Database Impact

### Migrations Required
1. **Indexes Migration** - Non-breaking, online-safe
2. **Soft Deletes Migration** - Add `deletedAt` columns, update queries
3. **Auth Enhancements Migration** - Add `mfaSecret`, `mfaBackupCodes`, `revokedAt` to User
4. **Certificate Revocation** - Add `revokedAt` to Certificate

### Migration Strategy
- Generate migration files with `prisma migrate dev`
- Review each migration in CI
- Apply to staging first, validate
- Schedule production migration during maintenance window
- **Rollback**: Each migration has `down` script tested in CI

### Data Volume Considerations
- Current: ~25 centres, ~1000 candidates, ~10 exams
- Production estimate: 1000+ centres, 500k+ candidates, 50+ exams
- Indexes critical for: Centre lookups, Session queries, Audit log pagination

---

## Deployment Impact

### Render (Backend)
- Add `REDIS_URL` env var (required for rate limiting)
- Update health check to verify Redis connectivity
- Configure auto-deploy on main branch
- Set `NODE_ENV=production`

### Vercel (Frontend)
- Add `VITE_API_URL`, `VITE_WS_URL` env vars
- Enable Vercel Analytics
- Configure preview deployments for PRs

### Supabase
- Enable Storage bucket policies (private by default)
- Configure PG connection pooler (already in DATABASE_URL)
- Enable automated backups (daily, 7-day retention)
- Set up read replicas for analytics queries

### Secrets Management
- Move all secrets to Render/Vercel secret stores
- Remove `.env` from repo (already in .gitignore)
- Document rotation procedure (quarterly for JWT, AES, HMAC)

---

## Rollback Strategy

### Per-Deployment Rollback
1. **Render**: Use Render dashboard → "Rollback" to previous deploy (instant)
2. **Vercel**: Use Vercel dashboard → "Promote to Production" previous deployment
3. **Database**: 
   - If migration applied: Run `prisma migrate resolve --rolled-back <migration_name>`
   - Restore from Supabase PITR (Point-in-Time Recovery) if data corruption

### Feature Flags for Risky Changes
- Rate limiting: `ENABLE_RATE_LIMITING` env var
- Token revocation: `ENABLE_TOKEN_REVOCATION` env var
- WebSocket heartbeat: `ENABLE_WS_HEARTBEAT` env var
- React Query: `ENABLE_REACT_QUERY` env var

### Emergency Procedures
- **Auth Compromise**: Rotate JWT_SECRET → all sessions invalidated → users re-login
- **DB Outage**: Failover to Supabase read replica (read-only mode)
- **WS Storm**: Disable WS via `ENABLE_WEBSOCKETS=false`, fallback to polling

---

## Definition of Done

| Criterion | Verification Method |
|-----------|---------------------|
| No default secrets in codebase | `grep -r "PARIKSHATANTRA_.*_SECRET" --include="*.ts" | grep -v ".example"` returns only config.ts with env vars |
| Prisma singleton used everywhere | `grep -r "new PrismaClient()" server/src/routes/` returns 0 results |
| Rate limiting on all write endpoints | `curl -X POST /api/auth/login` ×6 → 429 on 6th |
| Token revocation works | Login → logout → reuse token → 401 |
| Org scoping enforced | User from Org A cannot read Exam from Org B |
| WS heartbeat active | `netstat` shows ping/pong, stale connections cleaned |
| WS reconnection works | Kill WS → auto-reconnect within 10s → state restored |
| Database indexes applied | `EXPLAIN ANALYZE` shows index scans on key queries |
| Error boundaries catch errors | Throw in component → fallback UI shown |
| React Query caching works | DevTools shows cache hits, no duplicate requests |
| CI/CD deploys on merge | Push to main → Render + Vercel deploy → health checks pass |
| Monitoring alerts fire | Simulate error → alert received in configured channel |
| Backup restore tested | PITR restore to staging → data verified |
| Load test passes | k6 script completes with <1% errors, p95 < 500ms |

---

## Out of Scope for Phase 0

The following are explicitly **NOT** part of Phase 0:
- MFA/TOTP implementation (Phase 1)
- OAuth/OIDC integration (Phase 1)
- Biometric integration (Phase 2+)
- SMS gateway (Phase 2+)
- Full offline CBT (Phase 1)
- ML-based threat detection (Phase 2)
- OMR scanning pipeline (Phase 2)
- Certificate transparency log (Phase 1)
- Microservices decomposition (Never - not justified)
- New frontend framework (Never - React/Vite is fine)
- New database (Never - PostgreSQL is fine)
- Major dependency upgrades (Only security patches)

---

## Next Phase Preview (Phase 1: Production Hardening)

1. **MFA/TOTP** - Real implementation with backup codes
2. **OAuth/OIDC** - Google/Microsoft/SAML for government auth
3. **Offline CBT** - Full Service Worker + IndexedDB + sync
4. **Certificate Transparency** - Public log, revocation checking
5. **Payment Integration** - Razorpay/Stripe for exam fees
6. **Real-time Collaboration** - Invigilator dashboard, live proctoring
7. **Advanced Analytics** - Candidate performance, centre benchmarking
8. **Mobile App** - React Native wrapper for candidate app