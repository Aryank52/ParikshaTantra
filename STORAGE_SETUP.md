# ParikshaTantra — Object Storage & Supabase Storage Setup Guide

> **Storage Protocol**: Private Bucket & Signed URL Governance  
> **Canonical Target**: Supabase Storage / S3 / Local Dev Storage  
> **Service Layer**: `ObjectStorageService.ts`  

---

## 🏛️ Executive Summary

To prevent relational database inflation and slow query execution, candidate photos, educational certificates, scanned OMR answer sheets, and incident evidence are **never stored as Base64 strings inside PostgreSQL tables**.

Instead, file binary streams are routed through `ObjectStorageService`, which generates SHA-256 payload hashes, validates MIME formats, and uploads objects to private storage buckets.

---

## 📁 Storage Bucket Topology

| Folder Path | Purpose | Access Rule | Retention Policy |
| :--- | :--- | :--- | :--- |
| `candidate-documents/` | Educational & Caste Certificates | Private (Signed URL) | Policy Configurable |
| `candidate-photos/` | Candidate Passport Photos | Private (Signed URL) | 3 Years |
| `answer-sheets/` | Scanned OMR Answer Sheets | Private (Signed URL) | Permanent Audit Record |
| `incident-evidence/` | Leak Screenshots & SOC Evidence | Restricted Private | Permanent Audit Record |
| `exam-assets/` | Exam Question Diagrams & Formulae | Public Signed | Exam Cycle |
| `certificates/` | QR Verifiable Pass Certificates | Public Signed | Permanent |

---

## ⚙️ Configuration

### Supabase Storage Environment Configuration (`server/.env`)
```ini
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
STORAGE_BUCKET="parikshatantra-vault"
```

---

## 🛡️ File Security Rules

1. **MIME Type Validation**: Only `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, and `text/plain` are accepted.
2. **Size Limit Guards**: Max file size is capped at 10 MB per file buffer.
3. **SHA-256 Payload Hashing**: Every file object key is prefixed with its cryptographic SHA-256 hash digest.
4. **Signed URLs Only**: Buckets are kept private. Access requires `getSignedUrl(objectKey, expiresIn)`.
