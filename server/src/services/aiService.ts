import { PrismaClient } from '@prisma/client';
import { CONFIG } from '../config';
import { AuditLedgerService } from './auditLedgerService';

const prisma = new PrismaClient();

export interface AiChatPayload {
  message: string;
  portalContext: 'STUDENT' | 'GOVERNMENT';
  userRole?: string;
  userId?: string;
  userEmail?: string;
  candidateCode?: string;
  history?: { sender: 'user' | 'assistant'; text: string }[];
}

export interface AiChatResponse {
  answer: string;
  sources: { title: string; url?: string; type: 'CATALOG' | 'POLICY' | 'APPLICATION' | 'SYSTEM' | 'SECURITY' }[];
  suggestedActions?: { label: string; actionCode: string }[];
  toolExecuted?: string;
  timestamp: string;
}

export class AiService {
  /**
   * Sanitizes input to protect against prompt injection attacks.
   */
  private static sanitizeInput(text: string): { isSafe: boolean; reason?: string } {
    const forbiddenPatterns = [
      /ignore\s+previous\s+instructions/i,
      /reveal\s+(question|answer|key|vault|secret|hash)/i,
      /show\s+me\s+(all|encrypted)\s+questions/i,
      /export\s+question\s+bank/i,
      /bypass\s+security/i,
      /drop\s+table/i,
      /select\s+\*\s+from/i,
      /override\s+policy/i,
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) {
        return {
          isSafe: false,
          reason: 'Security Notice: Query contains unauthorized administrative override or restricted keyword pattern.'
        };
      }
    }
    return { isSafe: true };
  }

  /**
   * Main entry point for Pariksha AI Chatbot and Operations Copilot.
   */
  static async handleChat(payload: AiChatPayload): Promise<AiChatResponse> {
    const timestamp = new Date().toISOString();

    // 1. Sanitize Prompt
    const safetyCheck = this.sanitizeInput(payload.message);
    if (!safetyCheck.isSafe) {
      return {
        answer: safetyCheck.reason || 'Restricted Query.',
        sources: [{ title: 'ParikshaTantra AI Safety Protocol', type: 'SECURITY' }],
        timestamp,
      };
    }

    const query = payload.message.toLowerCase();
    const role = payload.userRole || 'CANDIDATE';
    const isGovPortal = payload.portalContext === 'GOVERNMENT';

    // 2. Candidate Portal Scope Handlers
    if (!isGovPortal || role === 'CANDIDATE') {
      return await this.handleCandidateAssistant(payload, query, timestamp);
    }

    // 3. Government / Admin Portal Scope Handlers
    return await this.handleAdminCopilot(payload, query, timestamp);
  }

  /**
   * Candidate Assistant Query Handler
   */
  private static async handleCandidateAssistant(
    payload: AiChatPayload,
    query: string,
    timestamp: string
  ): Promise<AiChatResponse> {
    const sources: AiChatResponse['sources'] = [
      { title: 'ParikshaTantra Candidate Help & Guidelines', type: 'POLICY' }
    ];

    // Intent 1: Application / Candidate Status
    if (query.includes('application') || query.includes('status') || query.includes('my exam')) {
      if (payload.userEmail || payload.candidateCode) {
        const app = await prisma.candidateApplication.findFirst({
          where: {
            OR: [
              { email: payload.userEmail || '' },
              { candidateId: payload.candidateCode || '' },
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        if (app) {
          sources.push({ title: `Application #${app.applicationNumber}`, type: 'APPLICATION' });
          return {
            answer: `Your application **${app.applicationNumber}** for exam code **${app.examCatalogCode}** is currently **${app.status}**. Category: ${app.category}. Assigned Preferred City: ${app.preferredCity1}.`,
            sources,
            suggestedActions: [
              { label: 'View Admit Card', actionCode: 'VIEW_ADMIT_CARD' },
              { label: 'Run Device Pre-Check', actionCode: 'RUN_DEVICE_CHECK' }
            ],
            toolExecuted: 'getCandidateApplicationStatus',
            timestamp
          };
        }
      }
      return {
        answer: 'To check your specific application status, ensure you are logged into your Candidate account or specify your Application Number. Currently, central and state public examination registrations are OPEN for UPSC CSE, NTA NEET-UG, SSC CGL, and IBPS PO.',
        sources,
        suggestedActions: [
          { label: 'Browse Exam Catalog', actionCode: 'NAVIGATE_CATALOG' },
          { label: 'Register / Apply', actionCode: 'START_REGISTRATION' }
        ],
        timestamp
      };
    }

    // Intent 2: Admit Card / Seat Node
    if (query.includes('admit card') || query.includes('hall ticket') || query.includes('roll number') || query.includes('seat')) {
      if (payload.userEmail || payload.candidateCode) {
        const admit = await prisma.admitCard.findFirst({
          orderBy: { createdAt: 'desc' }
        });
        if (admit) {
          sources.push({ title: `Admit Card Roll #${admit.rollNumber}`, type: 'APPLICATION' });
          return {
            answer: `Your Admit Card is **READY**. Roll Number: **${admit.rollNumber}**. Allocated Centre: **${admit.assignedCentreName}** (${admit.assignedCity}). Assigned Terminal: **${admit.assignedLabNode}**. Reporting Time: ${admit.reportingTime}.`,
            sources,
            suggestedActions: [{ label: 'Download Admit Card PDF', actionCode: 'DOWNLOAD_ADMIT_CARD' }],
            toolExecuted: 'getAdmitCardStatus',
            timestamp
          };
        }
      }
      return {
        answer: 'Admit Cards are issued automatically upon verification of candidate age, education, and fee payment. You can view, print, and verify your signed Admit Card from the Admit Cards section.',
        sources,
        suggestedActions: [{ label: 'Check Admit Cards', actionCode: 'NAVIGATE_ADMIT_CARDS' }],
        timestamp
      };
    }

    // Intent 3: Hardware / Device / Camera / Mic Check
    if (query.includes('device') || query.includes('camera') || query.includes('mic') || query.includes('system check') || query.includes('hardware')) {
      return {
        answer: 'Before entering the active CBT Exam Lobby, all candidates must complete the 5-point hardware diagnostic test. This verifies browser support, web camera video feed, microphone level, display resolution, and low latency network connectivity.',
        sources: [{ title: 'Hardware Diagnostic Manual', type: 'SYSTEM' }],
        suggestedActions: [{ label: 'Start Device Diagnostic Now', actionCode: 'RUN_DEVICE_CHECK' }],
        timestamp
      };
    }

    // Intent 4: Exam Catalog / Search
    if (query.includes('upsc') || query.includes('nta') || query.includes('ssc') || query.includes('ibps') || query.includes('mpsc') || query.includes('psc') || query.includes('exam')) {
      const exams = await prisma.examCatalogEntry.findMany({ take: 3 });
      sources.push({ title: 'National Exam Catalog Registry', type: 'CATALOG' });
      const examTitles = exams.map(e => `• **${e.title}** (${e.authorityCode}) - Exam Date: ${new Date(e.examDate).toLocaleDateString()}`).join('\n');
      return {
        answer: `Here are upcoming national & state examinations:\n\n${examTitles}\n\nYou can search and filter 15+ Central & State PSC catalog entries by level, category, and state.`,
        sources,
        suggestedActions: [{ label: 'Open Exam Catalog', actionCode: 'NAVIGATE_CATALOG' }],
        toolExecuted: 'searchExamCatalog',
        timestamp
      };
    }

    // Default Fallback
    return {
      answer: `Hello! I am **Pariksha AI**, your candidate examination copilot. I can assist you with:\n- Checking your application & admit card status\n- Explaining exam eligibility criteria & document requirements\n- Guiding you through device, camera & microphone pre-checks\n- Explaining CBT exam lobby procedures and result verification.`,
      sources,
      suggestedActions: [
        { label: 'View My Applications', actionCode: 'NAVIGATE_APPLICATIONS' },
        { label: 'Explore Exams', actionCode: 'NAVIGATE_CATALOG' }
      ],
      timestamp
    };
  }

  /**
   * Government & Operations Copilot Query Handler
   */
  private static async handleAdminCopilot(
    payload: AiChatPayload,
    query: string,
    timestamp: string
  ): Promise<AiChatResponse> {
    const role = payload.userRole || 'NATIONAL_AUTHORITY';
    const sources: AiChatResponse['sources'] = [
      { title: 'ParikshaTantra SOC Operations Protocol', type: 'SYSTEM' }
    ];

    // Audit logging for AI Copilot usage
    await AuditLedgerService.logEvent({
      eventType: 'AI_COPILOT_QUERY',
      actorId: payload.userId || 'GOV_USER',
      actorRole: role,
      action: 'AI_ADMIN_COPILOT_QUERY',
      ipAddress: '127.0.0.1',
      metadata: { queryPreview: payload.message.substring(0, 50) }
    });

    // Intent 1: Centre Readiness / Capacity / Hardware Grid
    if (query.includes('centre') || query.includes('readiness') || query.includes('capacity') || query.includes('terminal')) {
      const centres = await prisma.examCentre.findMany({ take: 5 });
      const readyCount = centres.filter(c => c.status === 'READY' || c.status === 'ACTIVATED').length;
      sources.push({ title: 'Centre Operational Database', type: 'SYSTEM' });

      return {
        answer: `**Centre Readiness Analysis**:\n- Total Exam Centres Registered: **${centres.length}**\n- Verified & Ready Centres: **${readyCount}**\n- High Connectivity Green Nodes: **${centres.filter(c => c.securityStatus === 'GREEN').length}**\n\nAll candidate lab terminals pass hardware hash attestation before activation tokens ($T_{centre}$) can be consumed.`,
        sources,
        suggestedActions: [{ label: 'View Centre Readiness Desk', actionCode: 'NAVIGATE_CENTRES' }],
        toolExecuted: 'getCentreReadiness',
        timestamp
      };
    }

    // Intent 2: Security Incidents / Anomaly / Threat Matrix
    if (query.includes('security') || query.includes('threat') || query.includes('incident') || query.includes('leak') || query.includes('attack')) {
      const securityEvents = await prisma.securityEvent.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
      sources.push({ title: 'SOC Security Threat Ledger', type: 'SECURITY' });

      const eventSummary = securityEvents.length > 0
        ? securityEvents.map(e => `• [${e.severity}] ${e.eventType} - Status: ${e.status} (Risk Score: ${e.riskScore})`).join('\n')
        : 'No critical open security incidents recorded in current operating cycle.';

      return {
        answer: `**SOC Security & Threat Summary**:\n${eventSummary}\n\nOur AI anomaly engine monitors TF-IDF leak similarity, off-hours vault access, and unauthorized terminal attempts in real time.`,
        sources,
        suggestedActions: [
          { label: 'Open SOC Security Dashboard', actionCode: 'NAVIGATE_SOC' },
          { label: 'Launch Attack Penetration Simulator', actionCode: 'NAVIGATE_SIMULATOR' }
        ],
        toolExecuted: 'getSecurityIncidentSummary',
        timestamp
      };
    }

    // Intent 3: Exam Activation / Blueprint / Vault
    if (query.includes('activation') || query.includes('token') || query.includes('vault') || query.includes('blueprint') || query.includes('release')) {
      sources.push({ title: 'Zero-Trust Question Vault & Activation Protocol', type: 'SECURITY' });
      return {
        answer: `**Global Exam Activation Engine**:\n- Question Vaulting: AES-256-GCM symmetric encryption with HKDF per-question key derivation.\n- Blueprint Governance: Requires **4-Eyes Dual Approval** (Approver A + Approver B signatures).\n- JIT Delivery: Derived center activation tokens ($T_{centre} = \\text{HMAC-SHA256}(K_{secret}, ExamID + CentreID + TimeWindow)$) release decrypted payloads strictly during active CBT sessions.`,
        sources,
        suggestedActions: [{ label: 'Inspect Question Vault', actionCode: 'NAVIGATE_VAULT' }],
        toolExecuted: 'getExamStatus',
        timestamp
      };
    }

    // Default Admin Copilot Response
    return {
      answer: `Greetings, **${role}**. I am **Pariksha AI Operations Copilot**.\n\nI can analyze:\n- National, State & District exam readiness\n- SOC live threat telemetry & AI leak forensics\n- Audit ledger Merkle root batch proofs\n- Centre activation token status & terminal node health.`,
      sources,
      suggestedActions: [
        { label: 'National Overview', actionCode: 'NAVIGATE_NATIONAL' },
        { label: 'SOC Security Dashboard', actionCode: 'NAVIGATE_SOC' }
      ],
      timestamp
    };
  }
}
