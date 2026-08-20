# ParikshaTantra — Exam Centre Operations Manual

## 🏫 Overview & Operational Readiness

This operational manual defines standard procedures for examination centre superintendents, invigilators, network engineers, and physical entry security officers.

---

## 🕒 Centre Exam Day Timeline

```
05:30 IST ──► Centre Security Perimeter Lock & CCTV System Verification
06:30 IST ──► Hardware 10-Point Readiness Test (/centre/hardware-check)
07:30 IST ──► Centre Edge Gateway Activation Token Input (/centre-gateway)
08:15 IST ──► Candidate Reporting & Admit Card QR Verification (/candidate-arrival)
08:45 IST ──► Terminal Node Assignment (Node 14B) & Biometric/Identity Hash Check
09:15 IST ──► Candidate Sandboxed Lobby Pre-Check (Camera & Mic Diagnostic)
09:30 IST ──► Live CBT Release & JIT Encrypted Question Payload Delivery
12:30 IST ──► Exam Completion, Local Encrypted Sync & Final Hash Digest Submission
13:30 IST ──► Paper Mode Answer Sheet Scanning & OMR Registration (/centre/answer-sheets)
```

---

## 🛡️ Pre-Exam 10-Point Checklist

Every exam centre must pass and submit the 10-point readiness check before JIT activation tokens can be verified:

1. **Power Supply**: Dual UPS battery backup + diesel generator on standby.
2. **Network Isolation**: Exam LAN disconnected from external internet browsing (isolated gateway proxy).
3. **CCTV Cameras**: 100% room coverage active and recording.
4. **Terminal Hardware**: Keyboard, mouse, display resolution (min 1024x768) verified.
5. **Browser Sandbox**: Fullscreen lock capability confirmed.
6. **Local Storage**: IndexedDB cache available for offline buffer fallback.
7. **JIT Token Scanner**: HMAC activation scanner operating.
8. **Invigilator Staff**: Physical identity badge verification complete.
9. **Emergency Freeze Signal**: WebSocket SOC connection active (`ws://`).
10. **Biometric/QR Desk**: Candidate check-in scanners online.

---

## 🚨 Emergency Protocols

### 1. Terminal Node Failure (Hardware Crash)
- Immediately move candidate to hot-standby spare terminal (e.g. `Node 15F`).
- Execute terminal reassignment via `/terminal-management`.
- Candidate session resumes seamlessly from last local IndexedDB answer state.

### 2. LAN Network Disruption
- CBT terminals automatically enter **OFFLINE BUFFER ACTIVE** mode.
- Answers are locally buffered with encrypted sequence numbers.
- When network restores, ordered queue synchronization flushes data back to Centre Edge Node.

### 3. Centre Security Lockdown (Quarantine)
- If SOC triggers a Centre Isolation, local JIT delivery stops.
- Active candidate sessions complete buffered questions safely under invigilator supervision.
