# ParikshaTantra Database ERD & Schema Guide

## Relational Entity Model (Prisma Schema)

### Key Entities
1. `Organization`: Top-level government tenants (Central, State, District).
2. `User`: Administrative accounts bound to 12 government roles.
3. `ExamCentre`: Physical exam centres registered with location, capacity, and security state.
4. `RegisteredDevice`: Terminal hardware nodes assigned to specific centres.
5. `Candidate`: Registered candidates with pseudonymized identity hashes.
6. `Question`: AES-256 encrypted question vault entries with 4-Eyes signatures.
7. `Exam`: Scheduled national/state examination entities.
8. `ExamBlueprint`: Cryptographically signed blueprint packages.
9. `CentreActivation`: Short-lived HMAC activation tokens.
10. `CandidateSession`: Live CBT terminal exam sessions.
11. `Submission`: Encrypted candidate submissions with answer hashes.
12. `AuditEvent`: Tamper-evident hash-chained audit ledger.
13. `SecurityEvent`: SOC security alerts and threat scores.
14. `LeakEvidence`: Investigated leak evidence with similarity scores.
15. `Certificate`: QR-verifiable digitally signed result certificates.
