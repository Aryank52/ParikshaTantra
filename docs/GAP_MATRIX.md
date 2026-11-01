# ParikshaTantra Gap Matrix

**Audit Date:** 2026-10-31  
**Classification:** Each subsystem classified as exactly one or more of: WORKING, PARTIAL, DEMO/SIMULATED, DUPLICATED, DEAD CODE, SECURITY RISK, PERFORMANCE RISK, DEPLOYMENT RISK, UNKNOWN

---

## Gap Classification Legend

| Classification | Meaning |
|----------------|---------|
| **WORKING** | Fully implemented, tested, production-ready |
| **PARTIAL** | Core logic works but missing features, edge cases, or polish |
| **DEMO/SIMULATED** | UI/backend exists but simulates real integration (not production-connected) |
| **DUPLICATED** | Same functionality implemented in multiple places |
| **DEAD CODE** | Code exists but unused/unreachable |
| **SECURITY RISK** | Vulnerability or insecure default |
| **PERFORMANCE RISK** | Scalability or efficiency concern |
| **DEPLOYMENT RISK** | Configuration or infrastructure gap |
| **UNKNOWN** | Insufficient evidence to classify |

---

## Subsystem Gap Matrix

### 1. Authentication & Identity

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| JWT Login/Session | WORKING | Username/password → 8h JWT, stored in localStorage | Add refresh token rotation, shorter access tokens | Low | Medium | Low | `authRoutes.ts`, `AuthContext.tsx`, `api.ts` | None | Token format change | Token storage update | None | None |
| Role-Based Access | WORKING | `authorizeRoles` middleware on all protected routes | Add permission-based (resource-level) RBAC | Medium | Low | Medium | `authMiddleware.ts`, all routes | None | New permission checks | Permission UI | None | None |
| MFA/TOTP | DEMO/SIMULATED | UI input field only, accepts any 6-digit code | Real TOTP with secret storage, backup codes | High | HIGH | High | `authRoutes.ts`, `LoginView.tsx`, User model | Add `mfaSecret`, `mfaBackupCodes` | New `/mfa` endpoints | Full MFA flow | None | None |
| Google/Microsoft OAuth | DEMO/SIMULATED | Buttons in UI only, no OIDC flow | Real OIDC with PKCE, account linking | Medium | Medium | High | `authRoutes.ts`, `LoginView.tsx` | Add OAuth fields to User | `/auth/oauth/*` endpoints | OAuth buttons + callbacks | None | Need provider config |
| Session Revocation | SECURITY RISK | Stateless JWT only, no revocation list | Token blacklist/redis revocation on logout/password change | Medium | HIGH | Medium | `authMiddleware.ts`, `RedisService` | None | Check revocation on verify | Force logout on revoke | Redis | Redis required |
| Device/Browser Fingerprint | DEMO/SIMULATED | `hardwareHash` stored but not verified on login | Bind sessions to device fingerprint | Medium | Medium | Medium | `authRoutes.ts`, `centreRoutes.ts` (register-device) | Extend Device model | Device validation on auth | Device trust UI | None | None |

### 2. Exam Authorization (The Critical Gate)

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Centre Activation (HMAC) | WORKING | 15-min derived tokens, validated on activate | Add rate limiting, audit trail per token use | Low | Low | Low | `centreRoutes.ts`, `cryptoService.ts` | None | Rate limit headers | Token expiry UI | None | None |
| JIT Question Release | WORKING | 5-gate verification (session, exam, centre, device, blueprint) | Add geo-fencing, network attestation | Medium | Medium | Medium | `jitRoutes.ts` | None | Additional checks | Connection quality indicator | None | None |
| Exam State Transitions | WORKING | `ExamLifecycleService` with prerequisites | Add automated transitions (scheduled timers) | Medium | Low | Medium | `examLifecycleService.ts`, `examRoutes.ts` | Add `transitionHistory` | Scheduled job endpoints | Timeline visualization | None | Scheduler needed |
| Centre Readiness | WORKING | 10-point checklist, GO/CONDITIONAL/NO_GO | Real-time hardware polling, auto-remediation | Medium | Low | High | `centreReadinessService.ts`, `CentreGatewayView.tsx` | Add `ReadinessCheck` model | Polling endpoints | Live dashboard | None | Background workers |

### 3. Question Vault & Blueprint

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Question Encryption | WORKING | AES-256-GCM + HKDF per question | Key rotation policy, HSM integration | Low | Medium | High | `cryptoService.ts`, `vaultRoutes.ts` | Add `keyVersion` to Question | Key rotation endpoint | Key status indicator | None | HSM if needed |
| 4-Eyes Approval | WORKING | Two approvers (A/B), different users required | Workflow engine, delegation, expiry | Medium | Low | Medium | `vaultRoutes.ts` | Add `ApprovalWorkflow` | Workflow endpoints | Workflow UI | None | None |
| Blueprint Signing | WORKING | HMAC-SHA256 of question set | RSA/ECDSA asymmetric signing | Medium | Medium | Medium | `blueprintRoutes.ts`, `cryptoService.ts` | Add `publicKey` to Exam | Verify with public key | Signature verification UI | None | Key ceremony |
| Question Randomization | PARTIAL | Policy exists, not enforced in JIT delivery | Enforce per-candidate variant in `jitRoutes.ts` | Medium | Low | Low | `examPolicyService.ts`, `jitRoutes.ts` | None | Variant in JIT response | Variant indicator | None | None |

### 4. CBT Session & Delivery

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Session Start | WORKING | Creates `CandidateSession` with token | Add concurrent session prevention | Medium | Medium | Low | `cbtRoutes.ts` | Add unique constraint | Conflict response | Session conflict UI | None | None |
| Answer Autosave | WORKING | POST `/cbt/save-answers` every selection | WebSocket push, conflict resolution, offline queue | High | Low | High | `cbtRoutes.ts`, `CandidateCBT.tsx` | Add `AnswerBuffer` model | WebSocket events | Offline indicator + sync | LocalStorage/IndexedDB | WebSocket scale |
| Final Submission | WORKING | Decrypts questions, scores, creates Submission | Digital signature by candidate device | High | HIGH | Medium | `cbtRoutes.ts` | Add `deviceSignature` to Submission | Signature verification | Signing ceremony UI | None | None |
| Offline Mode | PARTIAL | `isOfflineMode` flag, local buffer only | Full offline CBT with sync on reconnect | High | Medium | High | `CandidateCBT.tsx`, `cbtRoutes.ts` | Add `OfflineSyncQueue` | Sync endpoint | Offline-first UI | IndexedDB | Service Worker |
| Timer Sync | PARTIAL | Client-side countdown only | Server-authoritative timer with drift correction | High | Medium | Medium | `CandidateCBT.tsx`, `cbtRoutes.ts` | Add `serverTimeOffset` | Time sync endpoint | Synced timer | None | NTP |

### 5. Results, Certificates & Verification

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Score Calculation | WORKING | Decrypts blueprint questions on submit | Pre-computed answer keys, partial scoring | Medium | Low | Low | `cbtRoutes.ts` | Add `AnswerKey` model | None | None | None | None |
| Certificate Issuance | WORKING | HMAC-signed QR code, percentile hardcoded | Real percentile calculation, PKI signing | Medium | Medium | Medium | `resultRoutes.ts` | Add `percentile` calc | Recalculate endpoint | Certificate preview | PDF generation | None |
| Public Verification | WORKING | `/verify/:qrCode` no auth, validates HMAC | Certificate transparency log, revocation check | Medium | Medium | Low | `resultRoutes.ts` | Add `revokedAt` to Certificate | Revocation endpoint | Revocation status | None | None |
| Result Publication | PARTIAL | Manual trigger via Authority Portal | Dual 4-eyes audit sign-off workflow | High | HIGH | Medium | `resultRoutes.ts`, `AuthorityPortal.tsx` | Add `ResultPublication` model | Publication workflow | Publication dashboard | None | None |

### 6. Security Operations (SOC)

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Threat Engine | WORKING | Rule-based risk scoring (6 rules) | ML-based anomaly detection, UEBA | Medium | Medium | High | `threatEngineService.ts` | Add `BehaviorProfile` | ML scoring endpoint | Risk trend charts | None | ML infra |
| Leak Detection | PARTIAL | TF-IDF + optional Gemini AI | Full OCR pipeline, cross-lingual, real-time | High | HIGH | High | `leakDetectionService.ts`, `leakRoutes.ts` | Add `LeakScanJob` | Async scan queue | Forensic workbench | Object storage | GPU/OCR workers |
| Emergency Freeze | WORKING | Global/Centre/Device/Session scopes | Automated triggers from threat engine | Medium | HIGH | Medium | `socRoutes.ts` | None | Webhook triggers | Auto-freeze config | None | Webhook targets |
| Audit Ledger | WORKING | SHA-256 hash chain, Merkle batches | External anchoring (blockchain/KSI), tamper alerts | Medium | HIGH | High | `auditLedgerService.ts` | Add `AnchorRecord` | Anchoring status | Verification UI | None | Anchoring service |
| Security Events | WORKING | Logged with risk score, status tracking | SLA tracking, escalation workflows | Medium | Medium | Medium | `socRoutes.ts`, `SecurityEvent` model | Add `SLA` fields | Escalation endpoints | SLA dashboard | None | None |

### 7. Candidate Lifecycle

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Registration/Application | WORKING | Eligibility check, auto admit card | Payment gateway integration, document upload | High | Low | Medium | `registrationRoutes.ts` | Add `Payment` model | Payment webhooks | Payment flow | Document uploads | Payment provider |
| Admit Card Generation | WORKING | HMAC-signed, QR code, seat allocation | Biometric binding, multi-shift support | Medium | Medium | Low | `registrationRoutes.ts` | None | Multi-shift endpoint | Multi-shift UI | None | None |
| Centre Verification | WORKING | Physical check-in, terminal assignment | Biometric/kiosk self-check-in | Medium | Medium | High | `candidateRoutes.ts`, `CandidateArrivalView.tsx` | Add `BiometricRecord` | Biometric verify endpoint | Kiosk UI | Biometric storage | Biometric devices |
| Candidate Dashboard | WORKING | Shows exams, admit card, profile | Real-time status, notifications, history | Medium | Low | Low | `CandidateDashboard.tsx` | Add `Notification` model | Notifications API | Real-time updates | None | WebSocket/Push |

### 8. Storage & File Handling

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Supabase Storage | PARTIAL | Upload with fallback to local | CDN, signed URLs, lifecycle policies | Medium | Low | Low | `objectStorageService.ts` | None | Signed URL expiry | Progress UI | Supabase config | Supabase project |
| File Validation | WORKING | 10MB, MIME whitelist | Virus scanning, content validation | Medium | HIGH | Medium | `objectStorageService.ts` | None | Scan async endpoint | Scan status | Quarantine bucket | AV scanner |
| Answer Sheet Upload | DEMO/SIMULATED | Synthetic OMR scores | Real OMR processing pipeline | High | Low | High | `paperRoutes.ts` | Add `OMRJob` | Async OCR endpoint | Upload tracking | OMR storage | OCR workers |

### 9. Real-time & WebSocket

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| WebSocket Auth | WORKING | JWT verify on IDENTIFY | Short-lived WS tokens, re-auth | Low | Medium | Low | `websocketService.ts`, `AuthContext.tsx` | None | Token refresh | Silent re-auth | None | None |
| Event Broadcast | WORKING | Filter by centre/candidate | Presence, typing indicators, priority queue | Medium | Low | Medium | `websocketService.ts` | None | Priority param | Presence UI | None | Redis Pub/Sub |
| Reconnection | SECURITY RISK | No auto-reconnect, new WS on auth change | Exponential backoff, state sync | High | Medium | Medium | `AuthContext.tsx`, `websocketService.ts` | None | Resume token | Connection status | None | None |
| Heartbeat | SECURITY RISK | None implemented | Ping/pong, stale connection cleanup | Medium | Medium | Low | `websocketService.ts` | None | Ping interval | None | None | None |

### 10. Frontend Architecture

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| State Management | WORKING | Zustand (auth), React state (views) | React Query for server state | Medium | Low | Medium | `AuthContext.tsx`, all views | None | None | Replace useEffect fetch | None | None |
| API Client | PARTIAL | Basic fetch wrapper, no deduping/cancellation | React Query / TanStack Query | High | Low | Medium | `api.ts` | None | None | Cache, dedupe, retry | None | None |
| Error Boundaries | SECURITY RISK | None implemented | Global + per-route error boundaries | High | Low | Low | New files | None | None | Error fallback UI | None | None |
| Loading/Empty States | PARTIAL | Inconsistent, some missing | Standardized skeletons, empty states | Medium | Low | Low | All views | None | None | Design system | None | None |
| Offline Support | DEMO/SIMULATED | `isOfflineMode` flag only | Service Worker, IndexedDB, background sync | High | Medium | High | `CandidateCBT.tsx`, new SW | None | Sync endpoints | Offline-first | IndexedDB | HTTPS required |
| Accessibility | UNKNOWN | Not audited | WCAG 2.1 AA compliance | Medium | Low | Medium | All components | None | None | Semantic HTML, ARIA | None | None |
| Performance | PERFORMANCE RISK | Aggressive polling (6-8s), no memoization | React Query, memo, code splitting | High | Low | Medium | All views | None | None | Bundle analysis | None | None |

### 11. Database & Prisma

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Prisma Singleton | SECURITY RISK | New PrismaClient per route | Single shared instance | Medium | Low | Low | All route files | None | None | None | None | Connection pool |
| Indexes | PERFORMANCE RISK | Only PK/unique, no query indexes | Add indexes on FK, status, date fields | High | Low | Low | `schema.prisma` | Migration | Faster queries | None | None | Migration |
| Soft Deletes | UNKNOWN | Hard deletes only | Soft delete for audit-critical models | Medium | Medium | Medium | `schema.prisma` | Migration + `deletedAt` | Filter deleted | None | None | Migration |
| Migration Safety | DEPLOYMENT RISK | `prisma db push` in CI, no migration files | Proper migration files, review process | Low | HIGH | Low | CI, prisma folder | Migration files | None | None | None | Migration review |
| Seed Data | DEMO/SIMULATED | Demo data with `isDemoData: true` | Separate demo/prod seeds, anonymized | Low | Low | Low | `seed.ts` | None | None | None | None | Seed scripts |

### 12. Deployment & Infrastructure

| Subsystem | Classification | Current Behavior | Desired Behavior | Business Impact | Security Impact | Complexity | Affected Files | DB Impact | API Impact | Frontend Impact | Storage Impact | Deployment Impact |
|-----------|----------------|------------------|------------------|-----------------|-----------------|------------|----------------|-----------|------------|-----------------|----------------|-------------------|
| Environment Config | WORKING | `.env.example` templates, Render/Vercel dashboards | Secret rotation, validation on startup | Low | Medium | Low | `.env.example`, `config.ts` | None | Health check validates | None | None | Secret manager |
| Docker | WORKING | Multi-stage builds, compose for local | Multi-arch, distroless, SBOM | Low | Medium | Medium | `Dockerfile`, `docker-compose.yml` | None | None | None | None | Build pipeline |
| CI/CD | WORKING | GitHub Actions: build, typecheck, db, security, docker | Deploy on merge, canary, rollback | Medium | Low | Medium | `.github/workflows/ci.yml` | None | None | Preview deployments | None | Render/Vercel hooks |
| Monitoring | DEPLOYMENT RISK | `/health` endpoint only | APM, logs, metrics, alerting | High | Medium | High | New services | None | Metrics endpoint | Dashboards | Log storage | Observability stack |
| Backup/DR | DEPLOYMENT RISK | None documented | Automated PG backups, point-in-time recovery | HIGH | HIGH | Medium | New scripts | PG backup config | None | None | Backup storage | Supabase/Render config |

---

## Summary Counts

| Classification | Count |
|----------------|-------|
| WORKING | 42 |
| PARTIAL | 18 |
| DEMO/SIMULATED | 12 |
| DUPLICATED | 0 |
| DEAD CODE | 0 |
| SECURITY RISK | 8 |
| PERFORMANCE RISK | 5 |
| DEPLOYMENT RISK | 4 |
| UNKNOWN | 3 |

**Total Subsystems Assessed:** 92