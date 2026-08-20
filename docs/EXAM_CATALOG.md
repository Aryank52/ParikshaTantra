# ParikshaTantra Examination Catalog & Dataset Policy

## Overview
The ParikshaTantra Examination Catalog provides a unified, searchable registry for competitive, entrance, recruitment, banking, railway, defence, teaching, medical, engineering, law, and management examinations conducted across **India** at **Central, State, and District** administrative levels.

---

## Dataset Transparency & Attribution Policy

Every entry in the examination catalog contains explicit metadata attributes to ensure strict transparency:

| Attribute | Field Name | Options / Examples | Description |
|---|---|---|---|
| **Representation Type** | `representation_type` | `OFFICIAL`, `REFERENCE`, `DEMO`, `EXTERNAL` | Clarifies whether the entry represents a reference baseline or an official API integration. |
| **Demo Flag** | `is_demo_data` | `true` / `false` | Distinguishes prototype/demo seed data from live production integrations. |
| **Official URL** | `official_source_url` | E.g. `https://upsc.gov.in`, `https://neet.nta.nic.in` | Direct link to the governing authority's official public portal. |
| **Last Verification** | `data_last_verified` | Timestamp (ISO-8601) | Date on which exam dates and eligibility rules were last synchronized. |

---

## Representative Seed Authorities

### 1. Central Examination Authorities
- **NTA (National Testing Agency)**: NEET (UG), JEE (Main), UGC NET, CUET.
- **UPSC (Union Public Service Commission)**: Civil Services Examination (CSE), NDA, CDS.
- **SSC (Staff Selection Commission)**: CGL, CHSL, JE, Selection Post.
- **IBPS (Institute of Banking Personnel Selection)**: Bank PO, Clerk, SO.

### 2. State Public Service Commissions (PSCs)
- **MPSC**: Maharashtra Public Service Commission
- **UPPSC**: Uttar Pradesh Public Service Commission
- **BPSC**: Bihar Public Service Commission
- **WBPSC**: West Bengal Public Service Commission
- **KPSC**: Karnataka Public Service Commission
- **TSPSC**: Telangana State Public Service Commission
- **RPSC**: Rajasthan Public Service Commission
- **MPPSC**: Madhya Pradesh Public Service Commission
- **TNPSC**: Tamil Nadu Public Service Commission
- **GPSC**: Gujarat Public Service Commission
