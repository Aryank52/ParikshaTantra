# ParikshaTantra Exam-Day Operations Guide

## Overview
This document specifies the operational procedure for conducting high-stakes examination days using the **ParikshaTantra National Examination Operating System**.

---

## 🕒 Operational Timeline & Standard Operating Procedure (SOP)

| Time (IST) | Operational Milestone | System Service / Component | Responsible Role |
| :--- | :--- | :--- | :--- |
| **05:00** | Cryptographic Question Vaulting & Blueprint Signing | `CryptoService`, `blueprintRoutes.ts` | Question Approvers A & B |
| **07:30** | Centre Readiness Evaluation (10-Point Audit) | `CentreReadinessService`, `CentreGatewayView.tsx` | Centre Superintendent |
| **08:00** | Central Global Release & HMAC Token Derivation | `examLifecycleService.ts`, `examRoutes.ts` | National Exam Controller |
| **08:30** | CBT Terminal Hardware & Network Verification | `TerminalManagementView.tsx`, `centreRoutes.ts` | Invigilator / IT Officer |
| **08:45** | Candidate Arrival, Admit Card QR & Seat Node Allocation | `CandidateArrivalView.tsx`, `candidateRoutes.ts` | Physical Entry Staff |
| **09:15** | Pre-Exam Hardware Check & Sandboxed Lobby Lock | `CandidateCBT.tsx`, `cbtRoutes.ts` | Candidate |
| **09:30** | Live CBT Exam Release & Just-In-Time Question Payload Delivery | `jitRoutes.ts`, `ExamDayControlTower.tsx` | System Engine |
| **12:30** | Exam Completion & Answer Hash Sync | `cbtRoutes.ts`, `AuditLedgerService` | CBT Engine |
| **13:00** | Immutable Audit Ledger Snapshot & Result Approval | `resultRoutes.ts`, `PublicVerificationPortal` | Auditor / National Authority |

---

## 🛡️ Emergency Freeze Procedures

### 1. Global Exam Freeze
- **Trigger**: Critical paper leak confirmation or nationwide cyber threat.
- **Execution**: Click **EMERGENCY GLOBAL FREEZE** in `ExamDayControlTower.tsx` or POST `/api/soc/emergency-freeze` with `{ scope: 'GLOBAL', examId, reason }`.
- **Result**: Immediate WebSocket broadcast (`EXAM_FROZEN`), locking all active CBT sessions across all registered centres.

### 2. Centre Gateway Isolation
- **Trigger**: Local power outage, network degradation, or unauthorized LAN node detection.
- **Execution**: Mark Centre Security Status as `RED` in `CentreGatewayView.tsx` or POST `/api/soc/emergency-freeze` with `{ scope: 'CENTRE', centreId }`.
- **Result**: Centre Edge Node enters offline fallback mode with local encrypted buffering.

---

## 📊 Command Center Dashboards

1. **Exam Day Control Tower (`/control-tower`)**: Central operational overview of active exams, centre readiness, candidate attendance, terminal health score, and critical security alerts.
2. **Virtual Centre Gateway (`/centre-gateway`)**: Pre-exam 10-point checklist auditor and HMAC activation scanner.
3. **Terminal Management View (`/terminal-management`)**: Real-time lab node grid for locking, unlocking, and reassigning CBT terminals.
4. **Candidate Arrival Desk (`/candidate-arrival`)**: Admit card verification and seat allocation desk.
5. **AI Forensic Leak Workbench (`/leak-forensics`)**: 6-stage leak analysis engine with visual Question Exposure Graphs.
6. **Public System Status (`/status`)**: Real-time infrastructure health dashboard.
