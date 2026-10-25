# ▲ VORTEX // Complete Website Functionalities Guide

This document explains every screen, interactive workflow, CRUD operation, public API integration, and simulation tool inside the **VORTEX Serverless AI Inference & GPU Fleet Control Plane**.

---

## 1. Authentication & Workspace Onboarding (`AuthView.tsx`)

When you visit the application unauthenticated, you are greeted with a Silicon Valley / Vercel-inspired split-screen portal:

### A. Sign In to Console (Login Form)
- Authenticates an existing engineer against the SQLite `users` table (`POST /api/auth` with `action: "login"`).
- Pre-populated with the founder account (`daniel@vortex.sh` / `demo1234`) so reviewers can test immediately.
- Includes a password visibility toggle (`Eye` / `EyeOff`) and validation feedback banners.

### B. Provision Your Organization (Registration Form)
- Switch to the **"Create Account"** tab to register a brand-new user in SQLite (`POST /api/auth` with `action: "register"`).
- Captures:
  - **Full Name** (e.g., `Ada Lovelace`)
  - **Organization / Lab Name** (e.g., `Hyperion Labs`)
  - **Work Email** & **Password** (minimum 6 characters)
- Automatically generates a unique production API key prefix (`vtx_live_...`), stores the user in the `users` SQLite table, sets an HTTP-only session cookie, and transitions directly into the Control Plane.

### C. One-Click Instant Founder Demo
- Both the top navigation bar (**"Instant Founder Demo"**) and the bottom of the auth card provide a single-click bypass that logs you in as `Daniel Gyorfi (Staff Infrastructure Architect @ Vortex Labs Inc.)`.

### D. Session Persistence & Sign Out
- Sessions persist across browser refreshes via HTTP-only cookies (`vortex_session`).
- Clicking **"Sign Out"** in the top-right header clears the session cookie and returns to the authentication portal.

---

## 2. Fleet Telemetry & Bento KPI Header (`DashboardView.tsx`)

At the top of the authenticated dashboard, 4 real-time Bento KPI cards dynamically aggregate metrics across all deployments stored in SQLite:

1. **Active GPU Allocation**: Sums the total active GPU replicas (`Nodes`) across all deployments and shows the ratio of `LIVE` endpoints vs. total endpoints.
2. **Fleet Token Velocity**: Computes the mean throughput (`tok/s`) across all active clusters running speculative decoding.
3. **Global P95 TTFT Latency**: Displays the average 95th-percentile Time-To-First-Token (`ms`) and total 24-hour request volume (`k req/24h`).
4. **Real-Time Compute Burn**: Calculates exact hourly infrastructure spend (`$/hr`) based on each deployment's hardware tier (`B200` @ `$5.70/hr`, `H100` @ `$3.45/hr`, `A100` @ `$2.40/hr`, `L40S` @ `$1.80/hr`) multiplied by its active replica count. Hibernated endpoints automatically drop to `$0.00/hr`.

---

## 3. Live Hugging Face Hub Public API Integration

VORTEX consumes the public **Hugging Face Hub API** (`https://huggingface.co/api/models`) in two places:

### A. Trending Open-Weights Feed Strip (Dashboard Banner)
- Located directly below the KPI cards, this live strip fetches trending open-weight models from Hugging Face (`GET /api/hf-models?limit=4`), displaying real download counts and recommended GPU hardware.
- **1-Click Instant Deploy**: Clicking any trending model card in this strip immediately provisions a new `LIVE` deployment in SQLite with pre-configured `vLLM` FlashInfer flags and adds it to your fleet.

### B. Interactive Hugging Face Model Search (Inside Provisioning Modal)
- When creating or editing a deployment, the **"Hugging Face Hub Live Model Registry"** search box lets you query the live Hugging Face API in real time (try typing `mistral`, `qwen`, `llama`, `phi`, or `deepseek`).
- Clicking any search result automatically populates:
  - The full Hugging Face model ID (e.g., `mistralai/Mistral-Small-24B-Instruct-2501`)
  - A clean URL slug for the endpoint
  - The recommended GPU tier (`B200-192GB`, `H100-80GB`, `A100-80GB`, or `L40S-48GB`)
  - The optimal weight quantization (`FP8`, `FP16`, or `INT4-AWQ`)

---

## 4. Full CRUD Operations on GPU Deployments

All Create, Read, Update, and Delete actions execute against the SQLite database (`.data/vortex.sqlite`) and immediately update the UI with toast notifications:

### CREATE — Provision Serverless GPU Endpoint (`POST /api/deployments`)
Click **"+ Deploy Model Endpoint"** in the top-right of the dashboard to open `DeploymentModal.tsx`:
- **Model Selection**: Search the live Hugging Face Hub API, click one of the 5 curated Frontier Blueprints, or type a custom weight URI.
- **Hardware Architecture**: Select between `B200-192GB` (`$5.70/hr`), `H100-80GB` (`$3.45/hr`), `A100-80GB` (`$2.40/hr`), or `L40S-48GB` (`$1.80/hr`).
- **Edge Fabric Region**: Route to `IAD-1` (Virginia), `SFO-1` (Silicon Valley), `FRA-1` (Frankfurt), or `HND-1` (Tokyo).
- **Lifecycle State**: Launch as `LIVE`, `PROVISIONING`, `HIBERNATED` (`$0/hr`), or `DEGRADED`.
- **Replica Scaling & Precision**: Drag the slider (`1x` to `16x` GPU nodes), choose weight precision (`FP8`, `FP16`, `INT4-AWQ`), and set max concurrent batch size (`64` to `1024` sequences).
- **vLLM / TensorRT-LLM Runtime Flags**: Dynamically add, edit, or remove custom environment variables (`KEY=VALUE`).
- **Live Hourly Burn Estimator**: Dynamically previews the exact `$/hour` cost before you click **"Deploy Endpoint"**.

### READ, SEARCH & FILTER — Fleet Control Table (`GET /api/deployments`)
- **Real-Time Search Bar**: Filter deployments instantaneously by endpoint slug, Hugging Face model name, GPU architecture (`B200`, `H100`), or deployment ID.
- **Lifecycle Filter Pills**: Filter by `ALL`, `LIVE`, `HIBERNATED`, or `PROVISIONING`.
- **Region Selector**: Filter endpoints by edge region (`ALL REGIONS`, `IAD-1`, `SFO-1`, `FRA-1`, `HND-1`).
- **12-Point Telemetry Sparklines**: Each deployment card renders a live bar sparkline of token throughput alongside velocity (`t/s`), P95 latency (`ms`), and hourly burn (`$/h`).

### UPDATE — 3 Ways to Modify Existing Deployments (`PATCH /api/deployments/[id]`)
1. **Inline Replica Scaling (`-` / `+` buttons)**: Adjust the GPU node count directly on any deployment row. Scaling down to `0x` automatically transitions the cluster to `HIBERNATED` (`$0.00/hr`); scaling up from `0x` automatically wakes the cluster to `LIVE`.
2. **1-Click Hibernate / Wake Toggle (`Power` icon)**: Instantly scale an active cluster to zero (`HIBERNATED`) to stop compute billing, or wake a hibernated cluster back to `LIVE` (`2x` replicas).
3. **Full Reconfiguration Modal (`Edit` pencil icon)**: Re-open `DeploymentModal.tsx` pre-filled with the deployment's current settings to change its GPU tier, model weights, region, quantization, or runtime environment variables.

### DELETE & RESET — Decommission or Restore Fleet (`DELETE /api/deployments/[id]`)
- **Decommission Endpoint (`Trash` icon)**: Permanently removes the deployment from SQLite.
- **Reset Seed Fleet (`Reset Seed Fleet` button)**: Restores the original 5 frontier deployments in SQLite with a single click if you want a fresh slate after testing deletions.

---

## 5. Interactive Endpoint Sandbox & cURL Inspector (`InspectorDrawer.tsx`)

Clicking any deployment's name or its **Terminal (`>_`)** action button slides open the **Inspector Drawer** on the right side of the screen:

1. **Interactive Endpoint Sandbox**:
   - Enter any custom prompt payload in the textarea.
   - Click **"Run Inference Benchmark"** to simulate a live token stream from that specific edge region and GPU tier, displaying TTFT latency, quantization telemetry, and token/sec velocity.
   - If the deployment is currently `HIBERNATED`, the sandbox alerts you with a `[COLD-START WAKE]` notice prompting you to wake the cluster first.
2. **Production cURL Generator**:
   - Automatically formats a ready-to-run `curl https://<slug>.vortex.sh/v1/chat/completions` snippet pre-populated with your deployment's slug, model identifier, and prompt.
   - Includes a 1-click **"Copy cURL"** button.
3. **Injected Engine Flags & Quick Actions**:
   - Inspect all active `vLLM` environment variables and decommission, edit, or wake/hibernate the cluster directly from the drawer footer.
