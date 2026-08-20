# ParikshaTantra — AI Governance & Threat Engine Policy

## 🧠 AI Integration Principles

ParikshaTantra uses Artificial Intelligence to enhance security, detect insider threats, and evaluate paper leaks. AI serves as an **advisory intelligence layer** and never acts as a sole un-audited decision maker.

---

## 1. AI System Responsibilities

### A. Semantic Leak Detection Engine (`leakDetectionService.ts`)
- Compares leaked text and OCR extracted images against decrypted vault questions.
- Uses hybrid n-gram TF-IDF cosine similarity + Google Gemini 2.5 Flash semantic analysis.
- Generates similarity scores (0.0% to 100.0%) and AI explanation reports.

### B. Insider Threat Anomaly Engine (`threatEngineService.ts`)
- Analyzes user access metrics (bulk question requests, off-hours access, unauthorized IP subnets).
- Evaluates risk score (0 to 100) and recommends actions (`NONE`, `MONITOR`, `LOCK_SESSION`, `FREEZE_EXAM`).

---

## 2. Fail-Safe Deterministic Fallback Policy

```
┌─────────────────────────────────────────────────────────────┐
│                 Incoming Security Telemetry                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Deterministic Rule Engine (Primary)            │
│   (Jaccard Similarity, Request Frequency, IP Bounds)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                   Is Gemini API Available?
                    /                    \
            [YES]  /                      \ [NO / TIMEOUT]
                  ▼                        ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ Gemini AI Semantic Report │   │ Rule-Based Baseline Score │
│ (Enriched Explanation)    │   │ (100% Operational Guarantee)│
└───────────────────────────┘   └───────────────────────────┘
```

- If `GEMINI_API_KEY` is omitted, missing, or rate-limited, the system falls back seamlessly to rule-based evaluation.
- **Zero single-point-of-failure on external AI services.**

---

## 3. Ethical AI & Human-in-the-Loop Controls

1. **No Automated Cheating Verdicts**: Technical signals (camera occlusion, motion change) generate `TECHNICAL_MONITORING_EVENT` records rather than automatic disqualification.
2. **Mandatory Human Approval for Exam Freeze**: Emergency freeze actions triggered by AI threat scores require confirmation by an authorized SOC Operator or Exam Controller.
