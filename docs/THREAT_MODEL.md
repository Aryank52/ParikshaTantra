# ParikshaTantra Security Threat Model

## Threat Matrix & Mitigations

| Threat Vector | Description | Severity | System Mitigation |
| :--- | :--- | :--- | :--- |
| **Insider Paper Theft** | Author or reviewer attempts bulk download of question papers. | CRITICAL | AES-256 Vaulting, 4-Eyes Approval, AI Insider Threat Detection (locks session if >15 questions queried). |
| **Pre-Exam Paper Leak** | Exam paper leaked days in advance via Telegram or social media. | CRITICAL | **JIT Question Delivery**: Papers are never generated or stored at centres prior to live exam start time. |
| **Center Gateway Compromise** | Rogue administrator attempts to activate unapproved centre. | HIGH | Short-lived HMAC Derived Tokens ($T_{centre}$ bound to ExamID + CentreID + 15-min Window). |
| **Rogue Terminal Joining** | Attacker plugs unauthorized laptop into centre LAN. | HIGH | Terminal Device Registration, Hardware Fingerprinting, and MAC/IP authorization checks (`DEVICE_NOT_AUTHORIZED`). |
| **Audit Ledger Tampering** | Malicious DB admin attempts to delete or alter access logs. | HIGH | Tamper-Evident SHA-256 Hash Chaining ($H_n = \text{SHA256}(H_{n-1} + \text{payload})$). Verification flags exact corrupted block. |
| **Candidate Impersonation** | Student attempts proxy attendance. | HIGH | Physical Identity Verification at Centre Gateway & Pseudonymized Govt ID Hash (`identityHash`). |
| **Network Interruption** | Wi-Fi / WAN connection drops during CBT. | MEDIUM | Offline-Resilient Encrypted Answer Buffering with sequence numbers and retry queues. |
