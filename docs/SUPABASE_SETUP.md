# ParikshaTantra — Supabase Setup Guide

> **Managed Services**: Supabase PostgreSQL + Supabase Connection Pooler (PgBouncer) + Supabase Object Storage  

---

## 🏛️ Executive Summary

Supabase provides the managed PostgreSQL relational database engine and private object storage buckets for ParikshaTantra.

---

## 🛠️ PostgreSQL Setup & Connection Pooler

### 1. Database Connection Strings
From your Supabase Project Settings → Database Settings:

* **Pooled Connection (`DATABASE_URL`)**: Port `6543` in Transaction Mode. Use this for server runtime queries.
* **Direct Connection (`DIRECT_DATABASE_URL`)**: Port `5432` direct PostgreSQL connection. Use this for Prisma schema migrations (`npx prisma db push`).

---

## 📁 Object Storage Setup

### 1. Bucket Creation
Create a private storage bucket named `parikshatantra-vault` on the Supabase Dashboard.

### 2. Access Policy
Keep bucket public access **disabled**. `ObjectStorageService` generates short-lived signed URLs for candidate photo, document, and OMR answer sheet previews.
