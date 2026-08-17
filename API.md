# ParikshaTantra API Endpoints Specification

## Endpoint Reference

### Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate user and issue JWT bearer token.
- `GET /api/auth/me`: Get active authenticated user profile.
- `GET /api/auth/demo-users`: List pre-configured demo government accounts for quick role switching.

### Question Vault (`/api/vault`)
- `GET /api/vault/questions`: Query vaulted questions (with AI threat tracking).
- `POST /api/vault/create`: Create question in `DRAFT` state (AES-256 encrypted).
- `POST /api/vault/review/:id`: Transition question from `DRAFT` to `REVIEW`.
- `POST /api/vault/approve-dual/:id`: Execute 4-Eyes Dual Approval (Approver A / Approver B).

### Exam Blueprint (`/api/blueprint`)
- `POST /api/blueprint/generate`: Generate & sign Exam Blueprint package.
- `GET /api/blueprint/:examId`: Retrieve blueprint configuration.

### Exam Release & Activation (`/api/exams`)
- `GET /api/exams`: List scheduled examinations.
- `POST /api/exams/create`: Schedule new examination.
- `POST /api/exams/global-release`: Execute **GLOBAL EXAM RELEASE** & derive short-lived Centre Activation Tokens.

### Centre Network (`/api/centres`)
- `GET /api/centres`: List registered examination centres.
- `POST /api/centres/activate`: Validate short-lived Activation Token & activate Centre Gateway.
- `POST /api/centres/register-device`: Register or heartbeat terminal device.

### Just-In-Time Question Release (`/api/jit`)
- `POST /api/jit/request-questions`: Decrypt and release JIT question payload for authorized active candidate session.

### Candidate CBT (`/api/cbt`)
- `POST /api/cbt/start-session`: Initialize candidate exam lobby session.
- `POST /api/cbt/save-answers`: Auto-save encrypted local answer buffer.
- `POST /api/cbt/submit-final`: Final examination submission & digest generation.

### Security Command Centre (`/api/soc`)
- `GET /api/soc/dashboard`: Real-time SOC metrics, geographic centre states & alert feeds.
- `POST /api/soc/emergency-freeze`: Trigger Global, Centre, Device, or Session Emergency Freeze.

### Leak Detection & Forensics (`/api/leak`)
- `POST /api/leak/analyze`: Upload evidence snippet/screenshot & run semantic TF-IDF similarity match.

### Forensic Audit Ledger (`/api/audit`)
- `GET /api/audit/logs`: Query audit ledger events.
- `GET /api/audit/verify-chain`: Verify SHA-256 hash-chain integrity.

### Results & Verification (`/api/results`)
- `POST /api/results/generate`: Issue digitally signed certificate with QR code.
- `GET /api/results/verify/:qrCode`: Public QR certificate verification endpoint (No Auth Required).

### Attack Simulator (`/api/simulator`)
- `POST /api/simulator/execute`: Execute any of the 7 judge demo attack scenarios.
