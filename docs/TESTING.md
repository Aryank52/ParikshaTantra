# ParikshaTantra Automated & Security Testing Guide

## Test Suite Execution

### 1. Backend Verification Commands

```bash
# Test API Health
curl -s http://localhost:5000/api/health

# Test Attack Simulator Endpoint
curl -s -X POST http://localhost:5000/api/simulator/execute \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"DEMO_1"}'
```

---

## 7 Security Attack Scenarios Verified

| Scenario | Attack Vector | Expected Defense | Test Command Result |
| :--- | :--- | :--- | :--- |
| **DEMO 1** | Candidate role calls Vault API directly. | HTTP 403 Forbidden with Zero-Trust exception. | `STATUS: BLOCKED` |
| **DEMO 2** | Centre attempts activation with expired token. | Rejected by Centre Gateway engine (401). | `STATUS: REJECTED` |
| **DEMO 3** | Unregistered hardware MAC joins exam network. | JIT delivery denied; marked `DEVICE_NOT_AUTHORIZED`. | `STATUS: BLOCKED` |
| **DEMO 4** | Insider attempts bulk fetch of 45 questions. | AI Threat Engine assigns score >85 & locks session. | `STATUS: DETECTED` |
| **DEMO 5** | Database record altered directly in database. | Hash Chain Inspector detects broken block link. | `STATUS: TAMPER_DETECTED` |
| **DEMO 6** | Upload leaked screenshot snippet to investigator screen. | Semantic match engine finds 96.8% match with Q-10283. | `STATUS: MATCH_CONFIRMED` |
| **DEMO 7** | SOC Officer triggers Emergency Global Freeze. | Real-time WebSocket event halts all sessions. | `STATUS: EXAM_FROZEN` |
