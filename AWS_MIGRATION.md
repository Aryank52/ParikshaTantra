# ParikshaTantra — Future AWS Cloud Migration Blueprint

> **Architecture Purpose**: Long-Term High Scale AWS Deployment Blueprint  
> **Target Scale**: 1,000,000+ Concurrent CBT Examination Sessions  

---

## 🏛️ Executive Summary

While the immediate deployment targets **Vercel** (Frontend), **Render** (Backend), and **Supabase** (PostgreSQL/Storage), ParikshaTantra is architected with **Zero Vendor Lock-In**.

All services rely on standard interfaces (`Prisma`, `ObjectStorageService`, `RedisService`, `AIProviderFactory`), making future migration to Amazon Web Services (AWS) seamless.

---

## 🗺️ Subsystem Mapping Matrix

| Current Deployment | Future AWS Target Architecture | Migration Action Required |
| :--- | :--- | :--- |
| **Vercel Frontend** | **AWS CloudFront + S3 Static Hosting** | Deploy React Vite build output (`dist`) to private S3 bucket backed by CloudFront CDN edge distribution. |
| **Render Express Backend** | **AWS ECS / Fargate Container Service** | Containerize Node server via `Dockerfile`, deploy to ECS Fargate task definition with Application Load Balancer (ALB). |
| **Supabase PostgreSQL** | **AWS RDS Aurora PostgreSQL Multi-AZ** | Migrate PostgreSQL schema using standard `pg_dump` / `pg_restore` or AWS Database Migration Service (DMS). |
| **Supabase Storage** | **AWS S3 Private Buckets** | Reconfigure `ObjectStorageService` S3 driver endpoints with IAM role instance profiles and KMS server-side encryption. |
| **Upstash / Local Redis** | **AWS ElastiCache for Redis Cluster** | Provision Multi-AZ ElastiCache cluster for WebSocket Pub/Sub scaling and rate limiting. |
| **Server Env Master Keys** | **AWS KMS & Secrets Manager** | Replace static hex secrets with Envelope Encryption using AWS KMS Customer Managed Keys (CMK) and Secrets Manager rotation routines. |

---

## 🔒 Zero Vendor Lock-In Verification

1. **No Vendor-Specific APIs**: The Node.js Express server uses standard Node APIs, standard HTTP handlers, and standard WebSocket (`ws`) library calls.
2. **Prisma ORM Standard**: The relational database layer is 100% standard PostgreSQL without vendor-specific extensions.
