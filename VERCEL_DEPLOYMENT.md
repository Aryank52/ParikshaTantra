# ParikshaTantra — Vercel Frontend Deployment Guide

> **Target Platform**: Vercel Cloud Platform  
> **Frontend Stack**: React 18 + Vite + TypeScript 5.6 + TailwindCSS v3  

---

## 🏛️ Executive Summary

The ParikshaTantra Single Page Application (SPA) frontend is optimized for zero-downtime static site deployment on **Vercel**.

---

## ⚙️ Configuration & Environment Variables

### 1. Build Settings on Vercel Dashboard
* **Framework Preset**: Vite
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Root Directory**: `client`

### 2. Environment Variables Configuration
Configure the following parameters in **Vercel Project Settings → Environment Variables**:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend Express API Production URL | `https://parikshatantra-backend.onrender.com` |
| `VITE_WS_URL` | Backend Production WebSocket Endpoint | `wss://parikshatantra-backend.onrender.com` |

---

## 📄 Client Routing & SPA Rewrites (`client/vercel.json`)

To prevent HTTP 404 errors when users refresh client-side routes (`/candidate`, `/authority`, `/centre`, `/security`, `/verify`), the following rewrite rule is configured:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔒 Security Posture on Vercel

1. **Zero Secret Leakage**: No server cryptographic keys, database passwords, or master AES keys are built into the client JavaScript bundle.
2. **HTTPS Only**: Vercel automatically issues managed TLS/SSL certificates for custom domains.
