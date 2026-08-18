# ParikshaTantra — Disaster Recovery & High Availability Plan

## ⚡ Business Continuity & Resilience

This document outlines disaster recovery targets, failure scenarios, and fail-safe recovery procedures for national examination infrastructure.

---

## 1. Key Recovery Metrics

- **Recovery Time Objective (RTO)**: $< 60$ seconds for central gateway failover.
- **Recovery Point Objective (RPO)**: $0$ seconds for candidate CBT answer choices (backed up in local IndexedDB + double write buffer).

---

## 2. Failure Scenarios & Mitigations

### Scenario 1: Cloud Internet Outage at Examination Centre
- **Impact**: Centre Gateway loses internet connection to Central Cloud server.
- **Mitigation**: Centre Edge Node continues serving JIT question chunks locally from encrypted cache. Candidate terminals continue exam in **OFFLINE BUFFER ACTIVE** mode without timer interruption.

### Scenario 2: Terminal Hardware Crash / Screen Freeze
- **Impact**: Candidate terminal monitor or power fails mid-exam.
- **Mitigation**: Candidate is moved to spare hot-standby node (Node 15F). Invigilator updates terminal assignment via `/terminal-management`. CBT session resumes immediately from last saved state.

### Scenario 3: Database Server Crash
- **Impact**: Primary database instance drops offline.
- **Mitigation**: Automated PgBouncer connection pool failover to secondary Read Replica with write promotion in $< 15$ seconds.

### Scenario 4: Nationwide Paper Leak Crisis
- **Impact**: Leaked question snippet confirmed on Telegram / social media during active exam.
- **Mitigation**: National Exam Controller activates **EMERGENCY GLOBAL FREEZE** in `/control-tower`. All active CBT terminals instantly receive `EXAM_FROZEN` WebSocket broadcast, locking screens securely.

---

## 3. Data Backup Schedule

| Backup Type | Frequency | Destination | Encryption |
| :--- | :--- | :--- | :--- |
| **Prisma Database Dump** | Hourly | Encrypted Object Storage | AES-256-GCM |
| **Audit Ledger Snapshots** | Every 15 mins | Cold Transparency Log | SHA-256 Chained |
| **IndexedDB Local Buffers** | Continuous (Sub-sec) | Browser Local Sandbox | AES-GCM Local Key |
