-- Phase 0I: Add lifecycle-safe partial unique constraints
-- These constraints allow historical records while enforcing uniqueness for active/valid records only.

-- 1. CandidateSession: One active session per candidate per exam
-- Allows historical sessions (SUBMITTED, FROZEN, PAUSED, LOBBY, COMPLETED, etc.)
-- Only enforces uniqueness for active sessions
CREATE UNIQUE INDEX "CandidateSession_one_active_per_exam"
ON "CandidateSession" ("candidateId", "examId")
WHERE "status" IN ('ACTIVE', 'IN_PROGRESS', 'STARTED');

-- 2. CentreActivation: One valid activation per exam per centre
-- Allows historical/expired/revoked activations
-- Only enforces uniqueness for currently valid activations
CREATE UNIQUE INDEX "CentreActivation_one_valid_per_exam_centre"
ON "CentreActivation" ("examId", "centreId")
WHERE "isValid" = true;

-- Note: CandidateApplication @@unique([candidateId, examCatalogCode]) requires duplicate check first.
-- Run duplicate check query before applying:
-- SELECT "candidateId", "examCatalogCode", COUNT(*) AS "count"
-- FROM "CandidateApplication"
-- GROUP BY "candidateId", "examCatalogCode"
-- HAVING COUNT(*) > 1;