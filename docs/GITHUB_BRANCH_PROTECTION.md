# How to Protect the `main` Branch on GitHub

> **GitHub Banner**: *"Your main branch isn't protected. Protect this branch from force pushing or deletion, or require status checks before merging."*

---

## 🛠️ Option 1: 1-Click Setup via GitHub Web UI

1. Open your repository on GitHub: `https://github.com/Aryank52/ParikshaTantra`
2. Click the **"Protect this branch"** button on the banner (or go to **Settings** → **Branches** → **Add branch protection rule**).
3. Set **Branch pattern name** to `main`.
4. Check the following recommended checkboxes:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging** (select `ParikshaTantra Build, Test & Security Pipeline`)
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict who can push to matching branches**
5. Click **Save changes**.

---

## 💻 Option 2: Setup via GitHub CLI (`gh`)

If you have GitHub CLI (`gh`) logged in, run:

```bash
gh api -X PUT repos/Aryank52/ParikshaTantra/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["ParikshaTantra Build, Test & Security Pipeline"]}' \
  -f enforce_admins=false \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f restrictions=null
```
