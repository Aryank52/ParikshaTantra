# ParikshaTantra — Final Portal Walkthrough & System Specification

> **Platform Version**: 1.0.0 Productized Release  
> **Architecture**: Two-Portal Unified Platform + Pariksha AI Copilot + PostgreSQL & Provider Abstractions  

---

## 🏛️ Executive Walkthrough Summary

This document details the complete end-to-end user journeys for Candidates, Government Authorities, Centre Operators, and Security/Auditors across **ParikshaTantra**.

---

## 🎓 1. Candidate User Journey (Student Portal)

1. **Discovery & Login**: Candidate opens ParikshaTantra, explores filterable exam catalog entries (UPSC, NTA, SSC, IBPS, State PSCs), and logs into the **Student Portal**.
2. **Dashboard Overview**: Candidate views the top **NEXT EXAM** focal card displaying:
   - Exam Title: **UPSC Civil Services Preliminary Examination 2026**
   - Shift & Date: **Sunday, 24 May 2026 (Shift 1)**
   - Reporting Time: **08:30 AM IST**
   - Allocated Centre: **Kendriya Vidyalaya No. 1, R.K. Puram, New Delhi**
   - Seat Node: **Terminal Node 14B**
   - Admit Card Status: **AVAILABLE FOR DOWNLOAD**
3. **Hardware Pre-Check**: Candidate completes the 5-point diagnostic test verifying camera stream, microphone level, screen resolution, and low-latency network bandwidth.
4. **CBT Lobby & Session Execution**: Candidate enters active CBT lobby. Encrypted questions are released JIT over AES-256-GCM. Section navigation, KaTeX math rendering, review markers, and local storage buffer operate continuously.
5. **Result & Certificate Verification**: Candidate views verified scorecards and downloads QR-verifiable certificates signed by RSA/HMAC digests.
6. **Pariksha AI Student Assistant**: Candidate can trigger "Ask Pariksha AI" widget at any time to ask questions about application status, admit cards, or exam rules.

---

## 🏛️ 2. Government & Administrative Journey (Government Portal)

1. **Role-Based Authentication**: Administrative staff logs in with official credentials and TOTP MFA into specific roles (`NATIONAL_AUTHORITY`, `EXAM_CONTROLLER`, `SECURITY_OFFICER`, `AUDITOR`).
2. **Question Vault & 4-Eyes Governance**: Question content is encrypted with AES-256-GCM and HKDF key derivation. Blueprint release requires dual approver digital signatures (Approver A + Approver B).
3. **Centre Readiness & Activation**: National authority launches exam release, generating derived HMAC center activation tokens ($T_{\text{centre}}$) bound to exam ID, centre ID, and time window.
4. **Live Command Control Tower**: Operations team monitors live exam telemetry, active candidate sessions, terminal health grids, and network latency across 25+ cities.
5. **SOC Security & AI Anomaly Monitoring**: Security team monitors real-time GIS threat markers, TF-IDF leak similarity search, and off-hours vault access logs. Emergency global/centre/session freezes can be dispatched instantly.
6. **Tamper-Evident Audit Ledger**: Auditors verify continuous SHA-256 hash chains and $O(\log N)$ Merkle batch proof roots.
7. **Pariksha AI Operations Copilot**: Administrative staff uses the copilot drawer to analyze centre readiness, threat telemetry, audit Merkle roots, and activation tokens.

---

## 🏢 3. Centre Operations Journey

1. **Centre Login & Gateway Sync**: Centre operator logs into centre view (`DEL-001`).
2. **Readiness Checklist**: Verification of power, network, gateway, staff, and terminal node hardware attestation.
3. **Activation Token Consumption**: Centre consumes the derived HMAC activation token ($T_{\text{centre}}$) once, unlocking decrypted question packages for sandboxed terminals.
4. **Candidate Verification & Terminal Allocation**: Candidate admit card QR codes are scanned, seating node allocated, and attendance logged.
5. **Session Monitoring & Closure**: Invigilator monitors active candidate session states, handles temporary network reconnections cleanly, and locks submissions upon exam closure.
