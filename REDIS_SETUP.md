# ParikshaTantra — Redis Cache & Resilience Setup Guide

> **Caching Protocol**: Provider-Independent Resilient Cache Abstraction  
> **Service Layer**: `RedisService.ts`  
> **Deployment Target**: Render / Upstash Redis / In-Memory Degradation Fallback  

---

## 🏛️ Executive Summary

To accommodate free-tier hosting limits and sleep/reconnect cycles without corrupting active examinations, `RedisService` provides a **Zero-Dependency Abstraction Layer**.

When `REDIS_URL` is configured, the service utilizes Redis for rate limiting, active session presence tracking, and WebSocket state synchronization. If Redis is disabled, unconfigured, or drops connection, `RedisService` **gracefully degrades to an in-memory Map cache** with TTL garbage collection.

---

## 🔒 Fundamental Architecture Rule: PostgreSQL is Always Authoritative

Under no circumstances is an examination session, answer submission, question vault entry, certificate, or audit log stored *only* in Redis.

All state transitions are committed synchronously to PostgreSQL. Redis operates strictly as a volatile performance optimization layer.

---

## ⚙️ Configuration

### Environment Setup (`server/.env`)
```ini
# Optional Redis Configuration (Upstash / Render Redis)
REDIS_URL="redis://default:[PASSWORD]@[HOST]:6379"
```

---

## ⚡ Capabilities Provided by RedisService

1. **Token Bucket Rate Limiting (`checkRateLimit`)**: Protects `/api/auth`, `/api/catalog`, `/api/registration`, and `/api/ai` endpoints against DDoS abuse.
2. **Session Revocation Tracking**: Instant session invalidation upon emergency SOC freeze commands.
3. **Decrypted Question Caching**: Reduces AES decryption CPU overhead during high-concurrency JIT exam releases.
