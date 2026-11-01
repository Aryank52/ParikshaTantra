# ParikshaTantra Project Audit

**Audit Date:** 2026-10-31  
**Auditor:** Principal Engineer & Architecture Lead  
**Repository:** E:\PROJECTS\ParikshaTantra  
**Stack:** Vercel (React/Vite) → Render (Express/TS) → Prisma → Supabase PostgreSQL

---

## 1. System Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Vercel)                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ React/Vite  │  │ Zustand      │  │ WebSocket    │  │ API Client         │  │
│  │ + Tailwind  │  │ (Auth + UI)  │  │ Client       │  │ (fetch + Bearer)   │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
└─────────┼────────────────┼──────────────────┼───────────────────┼──────────────┘
          │                │                  │                   │
          │ HTTPS/WSS      │                  │                   │
          ▼                ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Render)                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Express + TS │  │ JWT Auth     │  │ RBAC Middle  │  │ WebSocket Server   │  │
│  │ Routes       │  │ (8h expiry)  │  │ (Role + Org) │  │ (ws library)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
└─────────┼────────────────┼──────────────────┼───────────────────┼──────────────┘
          │                │                  │                   │
          │ Prisma ORM     │                  │                   │
          ▼                ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (Supabase PostgreSQL)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Org      │ │ User     │ │ Exam     │ │ Centre   │ │ Candidate│ │ Question│ │
│  │ Centre   │ │ Device   │ │ Session  │ │ Submission│ │ Certificate│ │ Audit   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
          │
          │ Supabase Storage API
          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        OBJECT STORAGE (Supabase Storage)                        │
│  Buckets: candidate-documents, candidate-photos, answer-sheets,                │
│           incident-evidence, exam-assets, certificates                          │
└─────────────────────────────────────────────────────────────────────────────────┘

External Services:
- Google Gemini AI (optional, fallback to local rules)
- No real SMS gateway (simulated)
- No real biometric integration (simulated)
- No government identity integration (simulated)
```

---

## 2. Authentication Map

### Who Authenticates?
- **Candidates** - Student portal login
- **Government Officials** - Authority, State, District, Exam Controller, Question Reviewer/Approver
- **Centre Staff** - Centre Admin, Invigilator
- **Security Operations** - Security Officer, Auditor
- **Super Admin** - Platform administration

### How?
- **Primary**: Username/password → JWT (HS256, 8h expiry)
- **Demo MFA**: UI-only TOTP input (no actual verification)
- **Demo OAuth**: Google/Microsoft buttons in UI (no actual OIDC flow)
- **Session**: Stored in `localStorage` as `pt_token` / `pariksha_token`

### Where?
- **Frontend**: `AuthContext.tsx` manages token, user, WebSocket
- **Backend**: `authRoutes.ts` `/api/auth/login` → JWT creation
- **Middleware**: `authMiddleware.ts` `authenticateJwt` verifies on every request

### Token Storage (Frontend)
```typescript
// client/src/services/api.ts
localStorage.setItem('pt_token', token);
localStorage.setItem('pariksha_token', token);
```

### Verification (Backend)
```typescript
// server/src/middleware/authMiddleware.ts
const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
req.user = { userId, username, role, organizationId };
```

### Logout
- **Frontend**: Clears localStorage, dispatches `pt:auth_error` event
- **Backend**: No token revocation list (stateless JWT)
- **WebSocket**: Closes connection on token invalidation

### Session Expiry
- JWT expires in 8h (hardcoded in `authRoutes.ts` and `config.ts`)
- Frontend polls `/api/auth/me` on token change
- 401 response triggers `clearAuthSession()`

---

## 3. Authorization Map

### Role Hierarchy (highest → lowest)
```
SUPER_ADMIN
  └─ NATIONAL_AUTHORITY
       ├─ STATE_AUTHORITY
       │    └─ DISTRICT_AUTHORITY
       ├─ EXAM_CONTROLLER
       ├─ QUESTION_REVIEWER
       ├─ QUESTION_APPROVER
       ├─ SECURITY_OFFICER
       ├─ AUDITOR
       └─ CENTRE_ADMIN
            └─ INVIGILATOR
            └─ CANDIDATE
```

### Protected Subsystems & Required Authorization

| Subsystem | Required Role | Org Scope | State Scope | District Scope | Centre Scope | Exam Scope | Candidate Scope |
|-----------|---------------|-----------|-------------|----------------|--------------|------------|-----------------|
| **Question Vault** | QUESTION_REVIEWER+ | ✓ | - | - | - | - | - |
| **Blueprint Engine** | EXAM_CONTROLLER+ | ✓ | - | - | - | ✓ | - |
| **Global Exam Release** | NATIONAL_AUTHORITY+ | ✓ | - | - | - | ✓ | - |
| **Centre Activation** | CENTRE_ADMIN+ | ✓ | - | - | ✓ | ✓ | - |
| **CBT Session (JIT)** | CANDIDATE (session-bound) | - | - | - | ✓ | ✓ | ✓ |
| **SOC Dashboard** | SECURITY_OFFICER+ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Emergency Freeze** | SECURITY_OFFICER+ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Audit Ledger** | AUDITOR+ | ✓ | - | - | - | - | - |
| **Result/Certificate** | EXAM_CONTROLLER+ | ✓ | - | - | - | ✓ | ✓ |
| **Exam Catalog** | Public (no auth) | - | - | - | - | - | - |
| **Candidate Registration** | Public (no auth) | - | - | - | - | - | - |

### Authorization Enforced ONLY on Frontend (Security Risk)
- **None found** - All protected routes use `authenticateJwt` + `authorizeRoles` middleware
- **However**: Role checks in UI for navigation (Sidebar.tsx) - backend is source of truth

### Organization Scoping
- Users have `organizationId` (nullable for SUPER_ADMIN)
- Exams belong to Organization
- Centres belong to Organization
- Candidates allocated to Centre (indirect org scoping)
- **Gap**: No middleware enforces cross-org data access prevention beyond role checks

---

## 4. Examination Lifecycle Map

### Exam States (Prisma `Exam.status`)
```
SCHEDULED → RELEASE_READY → RELEASED → ACTIVE/RUNNING → PAUSED → FROZEN → COMPLETED → ARCHIVED
                    ↓
              (requires signed Blueprint)
```

### Centre States (Prisma `ExamCentre.status`)
```
REGISTERED → VERIFIED → READY → ACTIVATED → EXAM_RUNNING → SUBMISSION → CLOSED → AUDIT
```

### Room/Device States (Prisma `RegisteredDevice.status`)
```
AUTHORIZED ↔ DEAUTHORIZED ↔ BLOCKED ↔ OFFLINE
```

### Batch States
- **Not explicitly modeled** - Batches are implicit via `CandidateSession` grouping by exam+centre

### Candidate States (Prisma `Candidate`)
```
Created → Allocated Centre → Verified at Centre (isVerifiedAtCentre) → In Session → Submitted
```

### Session States (Prisma `CandidateSession.status`)
```
LOBBY → IN_PROGRESS → PAUSED → SUBMITTED
                ↓
             FROZEN (security incident)
```

### Submission States (Prisma `Submission.resultStatus`)
```
PENDING → COMPLETED → PASSED/FAILED → INVALIDATED
```

### Result States
- Score calculated on submission
- Certificate issued via `/api/results/generate`
- Public verification via `/api/results/verify/:qrCode` (no auth)

---

## 5. Storage Map

### Upload Paths
| Endpoint | Folder | Auth Required | Max Size | MIME Types |
|----------|--------|---------------|----------|------------|
| Not directly exposed | candidate-documents | Yes (via routes) | 10MB | JPEG, PNG, WebP, PDF |
| Not directly exposed | candidate-photos | Yes | 10MB | JPEG, PNG, WebP |
| `/api/paper/upload-answer-sheet` | answer-sheets | No (demo) | 10MB | JPEG, PNG, WebP, PDF |
| SOC/Leak routes | incident-evidence | Yes | 10MB | JPEG, PNG, WebP, PDF |
| Blueprint/Vault | exam-assets | Yes | 10MB | JPEG, PNG, WebP, PDF |
| Results | certificates | Yes | 10MB | JPEG, PNG, WebP, PDF |

### Signed URL Generation
```typescript
// server/src/services/objectStorageService.ts
getSignedUrl(objectKey, expirySeconds = 3600)
// Returns Supabase signed URL or local fallback route
```

### Provider Detection
```typescript
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (supabaseUrl && supabaseKey) {
  // Use Supabase Storage
} else {
  // Local filesystem fallback (./uploads/)
}
```

---

## 6. Realtime Map (WebSocket)

### Connection Flow
```
1. Frontend AuthContext: user + token available
2. new WebSocket(wsUrl)
3. onopen → send IDENTIFY { type: 'IDENTIFY', token, role, userId, username }
4. Backend verifies JWT, sets clientRecord.isAuthenticated = true
5. Backend sends IDENTIFY_ACK { status: 'AUTHENTICATED', role, userId }
```

### Event Types
| Event | Payload | Target Filtering |
|-------|---------|------------------|
| `EXAM_RELEASED` | examId, examCode, title, globalReleaseToken, expiresAt | All authenticated |
| `EXAM_FROZEN` | scope, examId/centreId, reason, message | targetCentreId, targetCandidateId |
| `EXAM_PAUSED` | examId, reason | targetCentreId |
| `EXAM_RESUMED` | examId | targetCentreId |
| `EXAM_STATE_CHANGED` | examId, examCode, previousState, newState | All |
| `SECURITY_ALERT` | title, user, riskScore, reasons | All |
| `DEVICE_BLOCKED` | deviceId, reason | targetCentreId |
| `SYSTEM_NOTICE` | message | All |

### Reconnection
- **Frontend**: No automatic reconnection (new WebSocket on user/token change)
- **Backend**: No heartbeat/ping-pong implemented
- **Session Expiry**: Frontend detects 401 → clears auth → WebSocket closes

---

## 7. Deployment Map

### Render (Backend)
- **Dockerfile**: Multi-stage (builder → runner)
- **Port**: Dynamic `process.env.PORT` (default 5000)
- **Health**: `/api/health` endpoint
- **Env**: All secrets in Render dashboard

### Vercel (Frontend)
- **vercel.json**: SPA rewrite to `/index.html`
- **Build**: `npm run build` → `dist/`
- **Env**: `VITE_API_URL`, `VITE_WS_URL`

### Docker Compose (Local)
- PostgreSQL 16 + Redis 7 + Backend + Frontend (nginx)
- Hardcoded secrets in compose file (dev only)

### CI/CD (GitHub Actions)
- **Jobs**: frontend, backend, database, security, docker
- **Database**: Spins up PostgreSQL, runs `prisma db push` + seed
- **Security**: `npm audit --audit-level=high`
- **Docker**: Builds both images

---

## 8. What Is Genuinely Working

| Capability | Status | Evidence |
|------------|--------|----------|
| JWT Authentication | ✅ WORKING | `authRoutes.ts`, `authMiddleware.ts`, `AuthContext.tsx` |
| Role-Based Authorization | ✅ WORKING | `authorizeRoles` middleware on all protected routes |
| Organization/Org Scoping | ✅ WORKING | User.orgId, Exam.orgId, Centre.orgId in Prisma + routes |
| Question Vault (AES-256-GCM) | ✅ WORKING | `cryptoService.ts`, `vaultRoutes.ts` - encrypt/decrypt/sign |
| 4-Eyes Dual Approval | ✅ WORKING | `vaultRoutes.ts` `/approve-dual/:id` with A/B slots |
| Exam Blueprint Signing | ✅ WORKING | `blueprintRoutes.ts` - HMAC-SHA256 signed checksum |
| Global Exam Release | ✅ WORKING | `examRoutes.ts` `/global-release` - derives HMAC tokens per centre |
| Centre Activation (HMAC) | ✅ WORKING | `centreRoutes.ts` `/activate` - validates 15-min tokens |
| JIT Question Delivery | ✅ WORKING | `jitRoutes.ts` `/request-questions` - 5-gate verification |
| CBT Session Management | ✅ WORKING | `cbtRoutes.ts` - start, save-answers, submit-final |
| Answer Autosave | ✅ WORKING | `/cbt/save-answers` with local buffer sync |
| Result Calculation | ✅ WORKING | `cbtRoutes.ts` submit-final decrypts & scores |
| Certificate Generation | ✅ WORKING | `resultRoutes.ts` - signed QR verification codes |
| Public Certificate Verify | ✅ WORKING | `/api/results/verify/:qrCode` (no auth) |
| Audit Ledger (Hash Chain) | ✅ WORKING | `auditLedgerService.ts` - SHA-256 chained, Merkle batches |
| Security Events | ✅ WORKING | `socRoutes.ts`, `securityEvent` model, risk scoring |
| Threat Engine (Insider) | ✅ WORKING | `threatEngineService.ts` - rule-based risk scoring |
| Leak Detection | ✅ PARTIAL | `leakDetectionService.ts` - TF-IDF + optional Gemini AI |
| Centre Readiness Audit | ✅ WORKING | `centreReadinessService.ts` - 10-point checklist |
| WebSocket Telemetry | ✅ WORKING | `websocketService.ts` + frontend AuthContext |
| Exam Catalog (Reference) | ✅ WORKING | `catalogRoutes.ts` - 15+ Indian exam entries |
| Candidate Registration | ✅ WORKING | `registrationRoutes.ts` - eligibility + admit card |
| Attack Simulator | ✅ WORKING (Demo) | `simulatorRoutes.ts` - 10 demo scenarios |
| AI Copilot (Chat) | ✅ WORKING | `aiService.ts` + `aiProvider.ts` - Gemini + fallback |
| Synthetic Demo Data | ✅ WORKING | `seed.ts` - 25 centres, 12 states, 10 orgs, users, questions |
| Automated Security Tests | ✅ WORKING | `simulatorRoutes.ts` DEMO_1-10 scenarios |
| Deployment Configs | ✅ WORKING | Vercel, Render, Docker, GitHub Actions |

---

## 9. What Is Only Simulated / Demo

| Feature | Simulation Level | Reality Gap |
|---------|------------------|-------------|
| **MFA/TOTP** | UI only - input field accepts any 6-digit code | No TOTP secret storage, no verification |
| **Google/Microsoft OAuth** | UI buttons only | No OIDC client config, no callback routes |
| **Biometric Verification** | UI mentions "Biometric Entry" | No STQC/DigiLocker integration, no device APIs |
| **Government SMS Gateway** | Not implemented | No Twilio/Provider integration |
| **Candidate Identity (Aadhaar/DigiLocker)** | Hash stored as `identityHash` | No actual government API integration |
| **AI Leak Analysis** | Falls back to TF-IDF when no Gemini key | Requires `GEMINI_API_KEY` for semantic analysis |
| **AI Threat Summary** | Falls back to rule-based when no Gemini key | Requires `GEMINI_API_KEY` |
| **AI Chat Copilot** | Falls back to rule-based when no Gemini key | Requires `GEMINI_API_KEY` |
| **Hardware Checks** | Synthetic values returned | No real WebRTC/device enumeration |
| **Paper/OMR Scanning** | Synthetic scores generated | No actual OMR processing |
| **Load Testing / Scale** | Not tested | Single instance architecture |

---

## 10. Critical Architecture Observations

### Strengths
1. **Clean Separation**: Auth (who) vs Exam Authorization (what/where/when) - properly separated in JIT flow
2. **Cryptographic Rigor**: AES-256-GCM, HKDF per-question keys, HMAC-SHA256 activation tokens, SHA-256 audit chains
3. **Zero-Trust Design**: Every CBT request validates exam state + centre state + device state + session state
4. **Audit-First**: Every state change logs to hash-chained immutable ledger
5. **Defense in Depth**: Threat engine, leak detection, emergency freeze at multiple scopes
6. **Deployment Ready**: Docker, CI/CD, health checks, environment templates

### Structural Concerns
1. **Single PrismaClient per route** - Creates new instance per request (should be singleton)
2. **No API Rate Limiting** - Redis service exists but not applied to routes
3. **Hardcoded Defaults** - JWT secret, AES key, HMAC key have defaults in config
4. **No Request Cancellation** - Frontend fetch has no AbortController
5. **Aggressive Polling** - 6-8s intervals on SOC/ControlTower dashboards
6. **No Error Boundaries** - React error boundaries missing
7. **WebSocket Fragility** - No reconnection, no heartbeat, no backpressure handling
8. **Demo Data as Production** - `isDemoData: true` on catalog entries, hardcoded seeds

---

## 11. Security-Critical Findings

| Issue | Severity | Location |
|-------|----------|----------|
| Default JWT secret in config | HIGH | `config.ts:6` |
| Default AES master key in config | HIGH | `config.ts:7` |
| Default HMAC activation key in config | HIGH | `config.ts:8` |
| No token revocation list | MEDIUM | Stateless JWT only |
| CORS permissive fallback | MEDIUM | `index.ts:55` - allows any origin in demo |
| PrismaClient per request | MEDIUM | Every route creates `new PrismaClient()` |
| No rate limiting on auth endpoints | MEDIUM | `/api/auth/login` unlimited attempts |
| WebSocket no heartbeat | MEDIUM | Stale connections not detected |
| No CSRF protection | LOW | API is Bearer token based |
| In-memory rate limit (not distributed) | LOW | `RedisService` uses local Map |

---

## 12. Files Requiring Attention

### Backend Priority
1. `server/src/config.ts` - Remove default secrets
2. `server/src/index.ts` - Add Prisma singleton, rate limiting, fix CORS
3. `server/src/middleware/authMiddleware.ts` - Add org-scoping enforcement
4. `server/src/services/websocketService.ts` - Add heartbeat, reconnection
5. All route files - Use shared PrismaClient

### Frontend Priority
1. `client/src/services/api.ts` - Add AbortController, request deduping
2. `client/src/context/AuthContext.tsx` - WebSocket reconnection logic
3. `client/src/views/*` - Add error boundaries, loading/empty states
4. `client/src/components/Sidebar.tsx` - Role-based nav from backend

### Database Priority
1. `server/prisma/schema.prisma` - Add indexes on frequently queried fields
2. Add composite unique constraints where needed
3. Consider soft-delete for audit-critical models

### Deployment Priority
1. Remove hardcoded secrets from `docker-compose.yml`
2. Add health check dependencies in Render
3. Configure Supabase Storage bucket policies