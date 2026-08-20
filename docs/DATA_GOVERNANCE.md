# ParikshaTantra — Data Governance & Lifecycle Policy

## 🏛️ Data Governance Architecture

This document governs data ownership, tenant boundaries, encryption policies, and data classification across central, state, and district examination authorities.

---

## 1. Data Classification Matrix

| Data Classification | Sensitivity | Examples | Security Control | Access Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **RESTRICTED_VAULT** | CRITICAL | Decrypted question text, master key shares | AES-256-GCM + 4-Eyes dual approval + HKDF derivation | National Exam Authority only |
| **CONFIDENTIAL_CANDIDATE** | HIGH | Candidate PII, Govt ID hashes, Admit cards | Pseudonymized SHA-256 + RBAC JWT guards | Candidate & Centre Superintendent |
| **OPERATIONAL_LOGS** | MEDIUM | Terminal heartbeats, JIT delivery timestamps | SHA-256 Hash Chain + Merkle Tree batching | SOC Operators & Auditors |
| **PUBLIC_CATALOG** | LOW | Exam dates, eligibility criteria, syllabi | CDN caching + Public GET routes | Open Public Access |

---

## 2. Multi-Tenant Regional Governance

```
                    ┌─────────────────────────┐
                    │ Central Authority (UPSC)│
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│  State Authority (MPSC) │                 │ State Authority (UPPSC) │
└──────────┬──────────────┘                 └──────────┬──────────────┘
           │                                           │
           ▼                                           ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│ District Control (Pune) │                 │District Control(Lucknow)│
└─────────────────────────┘                 └─────────────────────────┘
```

- Each tenant (Central, State, District) is isolated by `organizationId` foreign keys in Prisma models.
- JWT middleware enforces tenant scope checks, preventing a State PSC user from accessing another state's question vault.
