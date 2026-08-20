# Contributing to ParikshaTantra (परीक्षा तन्त्र)

Thank you for your interest in contributing to **ParikshaTantra**, the Secure National Examination & Anti-Leak Operating System.

---

## 📜 Code of Conduct

All contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please ensure respectful and professional interactions at all times.

---

## 🛠️ How to Contribute

### 1. Branch Naming Conventions
- `feature/description` for new capabilities or UI components.
- `fix/description` for bug fixes or security patches.
- `docs/description` for documentation updates.

### 2. Commit Message Standard
Follow clear, imperative commit messages:
```
feat(security): implement RSA-4096 asymmetric signature verification
fix(cbt): resolve IndexedDB answer sequence retry deduplication
docs(ci): update GitHub Actions workflow configuration
```

### 3. Pull Request (PR) Workflow
1. Fork or clone the repository.
2. Create your feature/fix branch: `git checkout -b feature/my-feature`
3. Verify local compilation and tests:
   ```bash
   npm run build
   npm run typecheck
   npm run prisma:validate
   ```
4. Commit your changes and push to your fork.
5. Submit a Pull Request targeting `main` or `develop`.

---

## 🔒 Security Requirements

- **Never Commit Secrets**: Do not commit real passwords, JWT secrets, database connection strings, or API keys.
- **Client Security Isolation**: Ensure no server secrets are exposed in `client/src`.
- **Zero Breakage**: Do not modify existing zero-trust cryptographic workflows, 4-Eyes dual approvals, or derived HMAC activation tokens.
