# ParikshaTantra — Secret Hygiene & Rotation Guide

> **Security Protocol**: Zero-Trust Key & Credential Governance  
> **Applicability**: Development, Staging, and Production Environments  

---

## 🔒 Secret Scan Audit Summary

During the Phase 4 Codebase Audit, a secret scan was executed across all client and server files, environment files, and git tracking logs.

### Findings & Action Items

| Secret Parameter | Location Found | Risk Status | Required Action |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | `server/.env` | **REQUIRED_ROTATION** | Key has been marked for rotation. Replaced with environment variable reference; must be issued fresh from Google AI Studio for production. |
| `JWT_SECRET` | `server/.env` | Template Default | Replace default template secret with high-entropy 256-bit secret string in production. |
| `AES_MASTER_KEY` | `server/.env` | Development Key | Derived 64-hex character key. Integrate with KMS Envelope Encryption (AWS KMS / GCP KMS) for production. |
| `HMAC_ACTIVATION_KEY` | `server/.env` | Development Key | Must be rotated per exam cycle. |

---

## 🛡️ Core Secret Governance Rules

1. **Zero Client Secrets**: No API keys, JWT signing keys, database credentials, or master encryption keys shall EVER be imported, referenced, or exposed in frontend client bundles (`client/src`).
2. **Git Tracking Policy**: `.env` and `.env.local` files are strictly ignored via `.gitignore`. Only `.env.example` with non-sensitive placeholder templates is committed to source control.
3. **Log Sanitization Policy**: Backend logging middleware must strip `Authorization`, `sessionToken`, `password`, `apiKey`, and `encryptedContent` header/body fields before outputting to stdout or log aggregators.
4. **Server Startup Validation**: `config.ts` enforces `validateSecrets()` on server launch, ensuring `AES_MASTER_KEY` is exactly 64 hex characters and `JWT_SECRET` meets minimum length requirements.

---

## 🔄 Secret Rotation Standard Operating Procedure (SOP)

### 1. Rotating JWT Signing Key
```bash
# 1. Generate new 256-bit high entropy secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update server/.env
JWT_SECRET=<new_generated_hex_secret>

# 3. Restart server cluster (graceful drain to allow existing sessions to terminate)
npm run start
```

### 2. Rotating AES Master Key (KMS DEK/KEK)
```bash
# 1. Generate new 64-character hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Re-encrypt existing question vault payloads with new key using vault migration script
npx ts-node src/scripts/migrateVaultKeys.ts --oldKey=<OLD_KEY> --newKey=<NEW_KEY>

# 3. Update AES_MASTER_KEY in server/.env
```

### 3. Rotating Gemini AI Backend Key
```bash
# 1. Revoke existing key in Google AI Studio console
# 2. Issue new API key
# 3. Export to server environment:
export GEMINI_API_KEY="AIzaSy..."
```

---

## 📋 Environment Configuration Template (`.env.example`)

```ini
# Server Configuration
PORT=5000

# Authentication & Cryptography (SERVER ONLY - NEVER EXPOSE TO FRONTEND)
JWT_SECRET=PARIKSHATANTRA_ULTRA_SECURE_JWT_SECRET_2026_PROD_GRADE
AES_MASTER_KEY=a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90
HMAC_ACTIVATION_KEY=PARIKSHATANTRA_HMAC_ACTIVATION_SECRET_KEY_998877665544332211

# AI Anomaly Engine Key (SERVER ONLY)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
