export type Role =
  | 'SUPER_ADMIN'
  | 'NATIONAL_AUTHORITY'
  | 'STATE_AUTHORITY'
  | 'DISTRICT_AUTHORITY'
  | 'EXAM_CONTROLLER'
  | 'QUESTION_REVIEWER'
  | 'QUESTION_APPROVER'
  | 'CENTRE_ADMIN'
  | 'INVIGILATOR'
  | 'SECURITY_OFFICER'
  | 'AUDITOR'
  | 'CANDIDATE';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  organization?: {
    name: string;
    code: string;
  };
  candidateCode?: string;
}

export interface Question {
  id: string;
  questionCode: string;
  subject: string;
  topic: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  status: string;
  questionHash: string;
  createdBy: string;
  reviewedBy?: string | null;
  approvedByA?: string | null;
  approvedByB?: string | null;
  text?: string;
  options?: string[];
}

export interface Exam {
  id: string;
  examCode: string;
  title: string;
  description?: string;
  status: 'SCHEDULED' | 'RELEASED' | 'RUNNING' | 'PAUSED' | 'FROZEN' | 'COMPLETED' | 'AUDITED';
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  globalReleaseToken?: string | null;
  blueprint?: any;
}

export interface ExamCentre {
  id: string;
  centreCode: string;
  name: string;
  state: string;
  district: string;
  geolocation: string;
  capacity: number;
  status: 'REGISTERED' | 'VERIFIED' | 'READY' | 'ACTIVATED' | 'EXAM_RUNNING' | 'SUBMISSION' | 'CLOSED' | 'AUDIT';
  connectivityStatus: string;
  securityStatus: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  actorId: string;
  actorRole: string;
  action: string;
  ipAddress: string;
  previousHash: string;
  currentHash: string;
  createdAt: string;
  metadataJson?: string;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  detailsJson: string;
  status: string;
  createdAt: string;
  centre?: { name: string; centreCode: string };
}

export interface ExamCatalogEntry {
  id: string;
  catalogCode: string;
  title: string;
  shortName: string;
  authorityCode: string;
  authorityName: string;
  level: 'CENTRAL' | 'STATE' | 'DISTRICT';
  category: string;
  subCategory?: string;
  state?: string;
  mode: string;
  frequency: string;
  applicationStart: string;
  applicationEnd: string;
  examDate: string;
  resultDate: string;
  feeAmount: number;
  minAge: number;
  maxAge: number;
  minEducation: string;
  languagesJson: string;
  syllabusOverview: string;
  officialSourceUrl: string;
  dataLastVerified: string;
  representationType: 'OFFICIAL' | 'REFERENCE' | 'DEMO' | 'EXTERNAL';
  isDemoData: boolean;
}

export interface StateMaster {
  id: string;
  code: string;
  name: string;
  capital: string;
  type: string;
  pscName: string;
  districtCount: number;
  totalCentres: number;
  totalSeats: number;
}

export interface DistrictMaster {
  id: string;
  code: string;
  name: string;
  stateCode: string;
  stateName: string;
  headquarters: string;
  seatingCapacity: number;
  activeCentres: number;
  connectivityScore: number;
  dmOfficerName: string;
}

export interface CandidateApplication {
  id: string;
  applicationNumber: string;
  candidateId: string;
  examCatalogCode: string;
  fullName: string;
  email: string;
  category: string;
  dob: string;
  qualification: string;
  preferredCity1: string;
  preferredCity2: string;
  status: string;
  feePaid: boolean;
  createdAt: string;
}

export interface AdmitCard {
  id: string;
  rollNumber: string;
  applicationNumber: string;
  candidateName: string;
  examTitle: string;
  examCode: string;
  category: string;
  assignedCentreCode: string;
  assignedCentreName: string;
  assignedCity: string;
  assignedLabNode: string;
  reportingTime: string;
  gateClosingTime: string;
  digitalSignature: string;
  qrChecksum: string;
  createdAt: string;
}

export interface OperationalAlert {
  id: string;
  code: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface ControlTowerExam {
  id: string;
  examCode: string;
  title: string;
  status: 'SCHEDULED' | 'RELEASED' | 'ACTIVE' | 'RUNNING' | 'PAUSED' | 'FROZEN' | 'COMPLETED' | 'AUDITED';
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  totalMarks: number;
  globalReleaseToken?: string | null;
  blueprint?: {
    totalQuestions: number;
    subjects: string[];
    signedChecksum?: string;
  } | null;
  metrics: {
    totalCentres: number;
    activatedCentres: number;
    totalRegisteredCandidates: number;
    activeSessions: number;
    submittedSessions: number;
  };
  allowedTransitions: string[];
}

export interface ControlTowerCentre {
  id: string;
  centreCode: string;
  name: string;
  state: string;
  district: string;
  capacity: number;
  status: string;
  connectivityStatus: string;
  securityStatus: string;
  readinessStatus: 'READY' | 'WARNING' | 'BLOCKED' | 'OFFLINE';
  readinessReason: string;
  deviceMetrics: {
    total: number;
    authorized: number;
    inExam: number;
    offline: number;
    maintenance: number;
  };
  hasActiveGateway: boolean;
  activeSessionsCount: number;
}

export interface ControlTowerDevice {
  id: string;
  deviceId: string;
  serialNumber: string;
  ipAddress: string;
  status: string;
  lastHeartbeat: string;
  centre: {
    id: string;
    centreCode: string;
    name: string;
    state: string;
    district: string;
  };
  diagnostics: {
    cameraStatus: 'PASS' | 'FAIL' | 'CHECKING';
    micStatus: 'PASS' | 'FAIL' | 'CHECKING';
    screenRes: string;
    networkLatencyMs: number;
    overallStatus: 'PASS' | 'FAIL';
  };
}

export interface ControlTowerSession {
  id: string;
  sessionToken: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'PAUSED' | 'SUBMITTED' | 'FROZEN';
  startedAt?: string | null;
  endedAt?: string | null;
  answerCount: number;
  candidate: {
    id: string;
    candidateCode: string;
    fullName: string;
    category: string;
  };
  exam: {
    id: string;
    examCode: string;
    title: string;
    status: string;
  };
  centre: {
    id: string;
    centreCode: string;
    name: string;
    state: string;
  };
  device: {
    id: string;
    deviceId: string;
    ipAddress: string;
    status: string;
  };
}
