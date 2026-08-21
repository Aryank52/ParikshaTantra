-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "organizationId" TEXT,
    "isMfaActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCentre" (
    "id" TEXT NOT NULL,
    "centreCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "geolocation" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "connectivityStatus" TEXT NOT NULL DEFAULT 'ONLINE',
    "securityStatus" TEXT NOT NULL DEFAULT 'GREEN',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamCentre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegisteredDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "hardwareHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AUTHORIZED',
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegisteredDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "candidateCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "allocatedCentreId" TEXT,
    "allocatedTerminalId" TEXT,
    "isVerifiedAtCentre" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ENGLISH',
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "encryptedContent" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "questionHash" TEXT NOT NULL,
    "digitalSignature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedByIdA" TEXT,
    "approvedByIdB" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 180,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "globalReleaseToken" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBlueprint" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectDistributionJson" TEXT NOT NULL,
    "difficultyDistributionJson" TEXT NOT NULL,
    "questionIdsJson" TEXT NOT NULL,
    "signedChecksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentreActivation" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "activationToken" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CentreActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOBBY',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "localAnswerBufferJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "encryptedAnswersJson" TEXT NOT NULL,
    "answerHash" TEXT NOT NULL,
    "digitalSignature" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "resultStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceId" TEXT,
    "metadataJson" TEXT,
    "previousHash" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "centreId" TEXT,
    "candidateId" TEXT,
    "deviceId" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "detailsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeakEvidence" (
    "id" TEXT NOT NULL,
    "evidenceCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "imageBase64" TEXT,
    "matchedQuestionId" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "riskLevel" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "submittedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNDER_INVESTIGATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeakEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "qrVerificationCode" TEXT NOT NULL,
    "signedHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCatalogEntry" (
    "id" TEXT NOT NULL,
    "catalogCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "authorityCode" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "state" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'CBT',
    "frequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "applicationStart" TIMESTAMP(3) NOT NULL,
    "applicationEnd" TIMESTAMP(3) NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "resultDate" TIMESTAMP(3) NOT NULL,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "minAge" INTEGER NOT NULL DEFAULT 18,
    "maxAge" INTEGER NOT NULL DEFAULT 35,
    "minEducation" TEXT NOT NULL DEFAULT 'GRADUATION',
    "languagesJson" TEXT NOT NULL,
    "syllabusOverview" TEXT NOT NULL,
    "officialSourceUrl" TEXT NOT NULL,
    "dataLastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "representationType" TEXT NOT NULL DEFAULT 'REFERENCE',
    "isDemoData" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamCatalogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capital" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pscName" TEXT NOT NULL,
    "districtCount" INTEGER NOT NULL DEFAULT 0,
    "totalCentres" INTEGER NOT NULL DEFAULT 0,
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistrictMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "headquarters" TEXT NOT NULL,
    "seatingCapacity" INTEGER NOT NULL DEFAULT 0,
    "activeCentres" INTEGER NOT NULL DEFAULT 0,
    "connectivityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "dmOfficerName" TEXT NOT NULL DEFAULT 'District Magistrate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistrictMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateApplication" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "examCatalogCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "preferredCity1" TEXT NOT NULL,
    "preferredCity2" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "feePaid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmitCard" (
    "id" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "examTitle" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assignedCentreCode" TEXT NOT NULL,
    "assignedCentreName" TEXT NOT NULL,
    "assignedCity" TEXT NOT NULL,
    "assignedLabNode" TEXT NOT NULL,
    "reportingTime" TEXT NOT NULL,
    "gateClosingTime" TEXT NOT NULL,
    "digitalSignature" TEXT NOT NULL,
    "qrChecksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmitCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditMerkleBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "startBlockId" TEXT NOT NULL,
    "endBlockId" TEXT NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "prevBatchRoot" TEXT NOT NULL,
    "signedAnchor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditMerkleBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerSheetScan" (
    "id" TEXT NOT NULL,
    "scanCode" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,
    "centreCode" TEXT NOT NULL,
    "candidateRoll" TEXT NOT NULL,
    "shiftCode" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "scanQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 98.5,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "uploadedBy" TEXT NOT NULL,
    "evaluatedScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerSheetScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareCheckLog" (
    "id" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "cameraStatus" TEXT NOT NULL DEFAULT 'PASS',
    "micStatus" TEXT NOT NULL DEFAULT 'PASS',
    "screenRes" TEXT NOT NULL,
    "storageCap" TEXT NOT NULL,
    "networkLatencyMs" INTEGER NOT NULL DEFAULT 12,
    "overallStatus" TEXT NOT NULL DEFAULT 'PASS',
    "detailsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwareCheckLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ExamCentre_centreCode_key" ON "ExamCentre"("centreCode");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredDevice_deviceId_key" ON "RegisteredDevice"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_candidateCode_key" ON "Candidate"("candidateCode");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Question_questionCode_key" ON "Question"("questionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_examCode_key" ON "Exam"("examCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBlueprint_examId_key" ON "ExamBlueprint"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "CentreActivation_activationToken_key" ON "CentreActivation"("activationToken");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSession_sessionToken_key" ON "CandidateSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "LeakEvidence_evidenceCode_key" ON "LeakEvidence"("evidenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_qrVerificationCode_key" ON "Certificate"("qrVerificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExamCatalogEntry_catalogCode_key" ON "ExamCatalogEntry"("catalogCode");

-- CreateIndex
CREATE UNIQUE INDEX "StateMaster_code_key" ON "StateMaster"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DistrictMaster_code_key" ON "DistrictMaster"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateApplication_applicationNumber_key" ON "CandidateApplication"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdmitCard_rollNumber_key" ON "AdmitCard"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdmitCard_applicationNumber_key" ON "AdmitCard"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdmitCard_qrChecksum_key" ON "AdmitCard"("qrChecksum");

-- CreateIndex
CREATE UNIQUE INDEX "AuditMerkleBatch_batchNumber_key" ON "AuditMerkleBatch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerSheetScan_scanCode_key" ON "AnswerSheetScan"("scanCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCentre" ADD CONSTRAINT "ExamCentre_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredDevice" ADD CONSTRAINT "RegisteredDevice_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_allocatedCentreId_fkey" FOREIGN KEY ("allocatedCentreId") REFERENCES "ExamCentre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_approvedByIdA_fkey" FOREIGN KEY ("approvedByIdA") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_approvedByIdB_fkey" FOREIGN KEY ("approvedByIdB") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamBlueprint" ADD CONSTRAINT "ExamBlueprint_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentreActivation" ADD CONSTRAINT "CentreActivation_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentreActivation" ADD CONSTRAINT "CentreActivation_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSession" ADD CONSTRAINT "CandidateSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSession" ADD CONSTRAINT "CandidateSession_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSession" ADD CONSTRAINT "CandidateSession_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSession" ADD CONSTRAINT "CandidateSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "RegisteredDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

