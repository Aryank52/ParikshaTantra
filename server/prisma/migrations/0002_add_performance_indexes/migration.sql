-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "ExamCentre_organizationId_status_idx" ON "ExamCentre"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ExamCentre_connectivityStatus_securityStatus_idx" ON "ExamCentre"("connectivityStatus", "securityStatus");

-- CreateIndex
CREATE INDEX "ExamCentre_state_district_idx" ON "ExamCentre"("state", "district");

-- CreateIndex
CREATE INDEX "RegisteredDevice_centreId_status_idx" ON "RegisteredDevice"("centreId", "status");

-- CreateIndex
CREATE INDEX "Candidate_allocatedCentreId_isVerifiedAtCentre_idx" ON "Candidate"("allocatedCentreId", "isVerifiedAtCentre");

-- CreateIndex
CREATE INDEX "Question_status_createdAt_idx" ON "Question"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Exam_organizationId_status_scheduledStart_idx" ON "Exam"("organizationId", "status", "scheduledStart");

-- CreateIndex
CREATE INDEX "Exam_status_scheduledStart_idx" ON "Exam"("status", "scheduledStart");

-- CreateIndex
CREATE INDEX "CentreActivation_examId_centreId_isValid_idx" ON "CentreActivation"("examId", "centreId", "isValid");

-- CreateIndex
CREATE INDEX "CandidateSession_examId_centreId_status_idx" ON "CandidateSession"("examId", "centreId", "status");

-- CreateIndex
CREATE INDEX "CandidateSession_candidateId_examId_idx" ON "CandidateSession"("candidateId", "examId");

-- CreateIndex
CREATE INDEX "Submission_examId_candidateId_idx" ON "Submission"("examId", "candidateId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_centreId_severity_status_createdAt_idx" ON "SecurityEvent"("centreId", "severity", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_candidateId_createdAt_idx" ON "SecurityEvent"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_deviceId_createdAt_idx" ON "SecurityEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "LeakEvidence_submittedBy_createdAt_idx" ON "LeakEvidence"("submittedBy", "createdAt");

-- CreateIndex
CREATE INDEX "LeakEvidence_matchedQuestionId_idx" ON "LeakEvidence"("matchedQuestionId");

-- CreateIndex
CREATE INDEX "ExamCatalogEntry_authorityCode_level_state_idx" ON "ExamCatalogEntry"("authorityCode", "level", "state");

-- CreateIndex
CREATE INDEX "ExamCatalogEntry_examDate_idx" ON "ExamCatalogEntry"("examDate");

-- CreateIndex
CREATE INDEX "ExamCatalogEntry_category_idx" ON "ExamCatalogEntry"("category");

-- CreateIndex
CREATE INDEX "DistrictMaster_stateCode_idx" ON "DistrictMaster"("stateCode");

-- CreateIndex
CREATE INDEX "CandidateApplication_examCatalogCode_status_idx" ON "CandidateApplication"("examCatalogCode", "status");

-- CreateIndex
CREATE INDEX "CandidateApplication_email_idx" ON "CandidateApplication"("email");

-- CreateIndex
CREATE INDEX "AdmitCard_examCode_assignedCentreCode_idx" ON "AdmitCard"("examCode", "assignedCentreCode");

-- CreateIndex
CREATE INDEX "AnswerSheetScan_examCode_centreCode_candidateRoll_idx" ON "AnswerSheetScan"("examCode", "centreCode", "candidateRoll");

-- CreateIndex
CREATE INDEX "AnswerSheetScan_status_createdAt_idx" ON "AnswerSheetScan"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HardwareCheckLog_checkType_entityId_createdAt_idx" ON "HardwareCheckLog"("checkType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "HardwareCheckLog_overallStatus_createdAt_idx" ON "HardwareCheckLog"("overallStatus", "createdAt");