# ParikshaTantra Implementation Task Tracker

**Last Updated:** 2026-11-01  
**Current Phase:** Phase 0 - Audit & Stabilization  
**Status:** In Progress

---

## Phase 0: Audit & Stabilization (Weeks 1-2)

### ✅ Phase 0A: Security Configuration Cleanup
- [x] Remove default JWT_SECRET from config.ts
- [x] Remove default AES_MASTER_KEY from config.ts
- [x] Remove default HMAC_ACTIVATION_KEY from config.ts
- [x] Add validation that fails fast if mandatory secrets missing
- [x] Update config.ts to require environment variables
- [x] Verify build passes with new config

### ✅ Phase 0B: Prisma Singleton
- [x] Create `server/src/lib/prisma.ts` singleton
- [x] Update all 18 route files to use shared PrismaClient
- [x] Update 5 service files to use shared PrismaClient
- [x] Keep seed.ts with its own instance (standalone script)
- [x] Verify build and typecheck pass

### ✅ Phase 0C: Organization/Tenant Authorization
- [x] Add org-scoping middleware (`enforceOrgScope`)
- [x] Prevent cross-org data access for exams, centres, candidates, questions, sessions, submissions, certificates
- [x] SUPER_ADMIN bypasses org scoping
- [x] NATIONAL_AUTHORITY can access questions globally
- [x] Audit logging for org scope violations
- [ ] Apply to all protected routes (selective application based on resource type)
- [ ] Test with multi-org scenarios

### ✅ Phase 0D: Rate Limiting
- [x] Created `server/src/middleware/rateLimitMiddleware.ts` with token bucket implementation
- [x] Applied `authRateLimiter` (5 req/min) to `/api/auth/login`
- [x] Applied `registrationRateLimiter` (3 req/5min) to `/api/registration/apply`
- [x] Applied `activationRateLimiter` (10 req/5min) to `/api/centres/activate`
- [x] Returns consistent HTTP 429 with `Retry-After` header and rate limit headers
- [x] Pre-configured limiters for auth, api write, api read, activation, registration
- [ ] Apply rate limiting to all write endpoints (60 req/min)
- [ ] Test rate limit behavior under load

### ✅ Phase 0E: CORS Hardening
- [x] Removed permissive fallback (`callback(null, true)` for unmatched origins)
- [x] Production requires explicit `CORS_ALLOWED_ORIGINS` env var
- [x] Development allows localhost origins by default
- [x] Returns proper CORS error for unauthorized origins
- [x] Verify CORS behavior in development vs production

### 🔄 Phase 0F: WebSocket Heartbeat/Reconnect
- [x] Backend: ping/pong heartbeat (30s interval)
- [x] Backend: Track connection timestamps, cleanup stale (>2min)
- [x] Backend: Connection presence events (CLIENT_JOINED/CLIENT_LEFT)
- [x] Backend: Client ID generation and tracking
- [x] Backend: getStats() for connection monitoring
- [x] Backend: Graceful shutdown handling
- [ ] Frontend: Handle PING/PONG in AuthContext
- [ ] Frontend: Exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s)
- [ ] Frontend: Connection state persistence across auth changes

### ✅ Phase 0G: API Abort/Cancellation/Deduplication
- [x] Added AbortController support to fetchApi
- [x] Added request deduplication with in-flight cache (GET requests)
- [x] Added `skipDedupe` option for mutations
- [x] Added `cancelAllRequests()` for logout/navigation
- [x] Added `createTimeoutSignal()` helper for request timeouts
- [x] Returns `{ data, abort }` when no external signal provided
- [ ] Cancel requests on component unmount (React integration needed)
- [ ] Cancel requests on 401/logout (clear cache on auth error)

### ⏳ Phase 0H: Error Boundaries + Consistent States
- [ ] Create ErrorBoundary component
- [ ] Wrap App routes in error boundaries
- [ ] Standardize loading/empty/error states across views
- [ ] Add skeleton loaders for async data

### ⏳ Phase 0I: Database Indexes/Migration Discipline
- [ ] Add indexes for FK, status, date fields
- [ ] Create proper Prisma migration files (not db push)
- [ ] Add migration review gate in CI
- [ ] Test migration on staging

### ⏳ Phase 0J: CI/CD Verification
- [ ] Add Render deploy job (on main branch)
- [ ] Add Vercel deploy job (on main branch)
- [ ] Add migration review gate (manual approval)
- [ ] Add smoke tests post-deploy

### ⏳ Phase 0K: End-to-End Verification
- [ ] Full auth flow test
- [ ] Exam lifecycle test
- [ ] CBT session test
- [ ] WebSocket test
- [ ] Storage test
- [ ] Load test: 1000 WS connections, 500 CBT submissions

---

## Phase 1: Production Hardening (Weeks 3-6)
- [ ] Real MFA/TOTP with backup codes
- [ ] OAuth/OIDC (Google/Microsoft/SAML)
- [ ] Offline CBT (Service Worker + IndexedDB + sync)
- [ ] Certificate transparency log + revocation
- [ ] Payment integration
- [ ] Real-time invigilator dashboard + proctoring

## Phase 2: Scale & Intelligence (Weeks 7-14)
- [ ] Multi-instance backend + Redis Pub/Sub
- [ ] ML-based threat detection (UEBA)
- [ ] OMR scanning pipeline
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Biometric integration (if mandated)

---

## Files Modified (Phase 0A + 0B + 0C + 0D)

### Server Config
- `server/src/config.ts` - Removed default secrets, added validation

### Prisma Singleton
- `server/src/lib/prisma.ts` - New shared singleton

### Middleware
- `server/src/middleware/authMiddleware.ts` - Added `enforceOrgScope` middleware for org/tenant scoping
- `server/src/middleware/rateLimitMiddleware.ts` - New token bucket rate limiting middleware

### Route Files Updated (18)
- `server/src/routes/authRoutes.ts` - Added auth rate limiter to login
- `server/src/routes/controlTowerRoutes.ts`
- `server/src/routes/candidateRoutes.ts`
- `server/src/routes/catalogRoutes.ts`
- `server/src/routes/auditRoutes.ts`
- `server/src/routes/vaultRoutes.ts`
- `server/src/routes/leakRoutes.ts`
- `server/src/routes/resultRoutes.ts`
- `server/src/routes/paperRoutes.ts`
- `server/src/routes/blueprintRoutes.ts`
- `server/src/routes/centreRoutes.ts` - Added activation rate limiter to activate
- `server/src/routes/simulatorRoutes.ts`
- `server/src/routes/hardwareCheckRoutes.ts`
- `server/src/routes/registrationRoutes.ts` - Added registration rate limiter to apply
- `server/src/routes/cbtRoutes.ts`
- `server/src/routes/examRoutes.ts`
- `server/src/routes/jitRoutes.ts`
- `server/src/routes/socRoutes.ts`

### Service Files Updated (5)
- `server/src/services/centreReadinessService.ts`
- `server/src/services/auditLedgerService.ts`
- `server/src/services/aiService.ts`
- `server/src/services/examLifecycleService.ts`
- `server/src/seed.ts` (kept local instance for standalone script)

---

## Verification Results

| Check | Status |
|-------|--------|
| Server TypeScript build | ✅ Pass |
| Server typecheck | ✅ Pass |
| Client TypeScript build | ✅ Pass |
| Client typecheck | ✅ Pass |
| No `new PrismaClient()` in routes | ✅ Verified |
| No default secrets in config | ✅ Verified |

---

## Next Steps

1. Apply Phase 0C middleware selectively to routes (exam, centre, candidate, etc.)
2. Implement Phase 0F Frontend: WebSocket reconnection logic
3. Implement Phase 0H: Error Boundaries + Consistent States
4. Implement Phase 0I: Database Indexes/Migration Discipline
5. Implement Phase 0J: CI/CD Verification
6. Implement Phase 0K: End-to-End Verification