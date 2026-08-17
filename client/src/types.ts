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
