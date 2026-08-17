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
