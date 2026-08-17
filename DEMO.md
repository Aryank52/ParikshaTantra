# ParikshaTantra Judge Demonstration Script

## Step-by-Step Judge Live Demonstration Flow

### Step 1: National Authority Creates & Vaults Questions
1. Navigate to [http://localhost:3000](http://localhost:3000).
2. Switch role in top right to **`QUESTION_REVIEWER: Dr. Suresh Kumar`**.
3. Go to **Question Vault & Blueprint** -> Select **Question Vault**.
4. Click **Sign A** for Question `Q-10283` using **`q_approver_a`**.
5. Switch persona to **`q_approver_b`** and click **Sign B**.
6. Observe status badge transition to **`4-EYES VAULTED`** (AES-256 encrypted at rest).

### Step 2: Exam Blueprint & Global Release
1. Go to **Blueprint Engine** -> Click **Generate & Sign Blueprint**.
2. Go to **Global Exam Release Control Room**.
3. Select `EXAM-NAT-2026` -> Click **EXECUTE GLOBAL EXAM RELEASE**.
4. Observe real-time generated short-lived Activation Tokens ($T_{centre} = \text{ACT-NAT-2026-DELHI-01-...}$) with 15-minute expiry.

### Step 3: Centre Gateway Activation & Candidate CBT
1. Go to **Centre Network & Activation** -> Paste/scan derived Activation Token -> Click **Activate Centre Gateway**.
2. Go to **Candidate CBT Engine** -> Click **Launch Sandboxed Examination**.
3. Observe JIT question delivery, section palette, timer, answer auto-save, and offline buffer sync.
4. Complete exam -> Click **Final Examination Submission** -> View cryptographic answer hash digest.

### Step 4: Security Command Centre & Attack Simulation
1. Go to **Security Command Centre** -> Observe live metrics and geographic centre map.
2. Go to **Attack Simulator (Judge Demo)**.
3. Click through each of the **7 Attack Vectors** (`DEMO_1` to `DEMO_7`) and showcase live backend defenses in real time!
