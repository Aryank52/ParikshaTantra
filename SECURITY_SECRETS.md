# ParikshaTantra — Security & Secrets Audit Policy

## 🔒 Secret & API Key Audit Report

### 1. Executive Summary
A repository-wide security scan was performed across all source files, configurations, and frontend components to detect hard-coded API credentials, private cryptographic keys, and database passwords.

---

### 2. Audit Findings & Inventory

| Credential / Secret | Found Location | Status | Action Taken / Verification |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | `server/.env` | ⚠️ Isolated | Restricted to backend `CONFIG`. **Never sent to frontend clients.** |
| `JWT_SECRET` | `server/.env`, `config.ts` | ✅ Configured | Isolated to backend server. Strong default enforced. |
| `AES_MASTER_KEY` | `server/.env`, `config.ts` | ✅ Configured | 256-bit Hex Key (64 chars). Server-isolated. |
| `HMAC_ACTIVATION_KEY`| `server/.env`, `config.ts` | ✅ Configured | Derived key generation isolated to server `CryptoService`. |
| Client-Side API Keys | `client/src/*` | 🟢 Clean | Zero API keys, database credentials, or AI tokens found in frontend code. |

---

### 3. Secret Isolation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│   (Zero API Keys / Zero Master Keys / Pure JWT Bearer)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS API Calls (Bearer JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server Backend (Node.js)                   │
│   - Reads process.env via dotenv                             │
│   - Validates key length & format at startup                │
│   - Encrypts/Decrypts Vault Questions                       │
│   - Executes Gemini API calls server-side only             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Required `.env` Configuration (`server/.env.example`)

```env
# Server Operating Port
PORT=5000

# Cryptographic Master Secrets (Must be overridden in production)
JWT_SECRET=PARIKSHATANTRA_ULTRA_SECURE_JWT_SECRET_2026_PROD_GRADE
AES_MASTER_KEY=a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90
HMAC_ACTIVATION_KEY=PARIKSHATANTRA_HMAC_ACTIVATION_SECRET_KEY_998877665544332211

# AI Intelligence Service (Server-side isolation only)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 5. Startup Verification Enforcer

The server startup routine (`validateSecrets()` in `src/config.ts`) executes mandatory sanity checks:
1. Verifies `AES_MASTER_KEY` is exactly 64 hexadecimal characters (32 bytes).
2. Verifies `JWT_SECRET` exceeds 16 characters.
3. Logs whether Gemini AI integration is running in active AI mode or rule-based fallback mode.
4. Prevents process execution if key formats are violated in production mode.

---

### 6. Key Rotation & Revocation Protocol

1. **Compromise Remediation**: If an `AES_MASTER_KEY` or `GEMINI_API_KEY` is inadvertently exposed:
   - Revoke the old key immediately via Google AI Studio / Cloud Console.
   - Re-encrypt existing vault payload records using a migration script (`npx ts-node src/scripts/rotateKeys.ts`).
2. **Git Hygiene**: `server/.env` is strictly listed in `.gitignore`. No commit shall ever include real production credentials.
