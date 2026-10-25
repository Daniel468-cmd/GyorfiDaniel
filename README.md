# ▲ VORTEX // Serverless AI Inference & GPU Fleet Control Plane

**VORTEX** is a modern, Silicon Valley / Vercel-adjacent full-stack web application built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, a relational **SQLite (WAL mode)** database engine, and real-time integration with the **Hugging Face Hub Public API**.

It provides an enterprise control plane for AI engineering teams to authenticate, discover trending open-weight models from Hugging Face, provision dedicated GPU clusters (`NVIDIA B200`, `H100`, `A100`, `L40S`), manage deployment lifecycles (full CRUD), scale replicas, and benchmark token velocity.

---

## Companion Documentation

- **[README.md](./README.md)** *(This file)* — Architecture overview, technology stack, database schema, public API integration, installation requirements, and step-by-step instructions to build and run the project.
- **[FUNCTIONALITIES.md](./FUNCTIONALITIES.md)** — Complete walkthrough of every website feature, user flow, authentication mode, CRUD operation, interactive sandbox tool, and UI component.

---

## 1. What Was Built & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15.5 (App Router)** | Server & Client Components, REST API Route Handlers, zero-config bundling |
| **UI & Styling** | **React 19 + Tailwind CSS** | Obsidian `#050505` aesthetic, `1px` specular borders, radial spotlights, architectural grid |
| **Typography** | **Geist / Inter + JetBrains Mono** | High-contrast engineering headers paired with tabular monospace telemetry |
| **Database** | **SQLite (`node:sqlite` in WAL Mode)** | Zero-external-daemon relational SQL database stored at `.data/vortex.sqlite` |
| **Public API** | **Hugging Face Hub REST API** | Live querying of `https://huggingface.co/api/models` for open-weight model discovery |
| **Auth** | **HTTP-Only Cookie Sessions** | Stateful registration, login, 1-click Founder Demo pass, and session persistence |
| **Icons** | **Lucide React** | Minimalist technical iconography |

---

## 2. Database Architecture (SQLite Relational Engine)

The application uses Node's built-in **SQLite** engine (`node:sqlite` `DatabaseSync`) configured with `PRAGMA journal_mode = WAL;` for high-concurrency read/write performance. The database file is automatically created and seeded on first boot at `.data/vortex.sqlite`.

### Relational Tables (`src/lib/db.ts`)

1. **`users` Table**:
   - `id` (`TEXT PRIMARY KEY`) — Unique user identifier (e.g., `usr_founder_01`)
   - `name` (`TEXT NOT NULL`) — Full name
   - `email` (`TEXT UNIQUE NOT NULL`) — Login email address (indexed & case-insensitive lookup)
   - `role` (`TEXT NOT NULL`) — Engineering title
   - `organization` (`TEXT NOT NULL`) — Lab or company workspace name
   - `password_hash` (`TEXT NOT NULL`) — Account credential
   - `api_key_prefix` (`TEXT NOT NULL`) — Generated Bearer API token prefix (`vtx_live_...`)
   - `created_at` (`TEXT NOT NULL`) — ISO-8601 timestamp

2. **`deployments` Table**:
   - `id` (`TEXT PRIMARY KEY`) — Deployment identifier (e.g., `dep_vtx_9921a`)
   - `name` & `slug` (`TEXT NOT NULL`) — Human-readable name and URL-safe routing slug
   - `model` (`TEXT NOT NULL`) — Hugging Face or S3 model weights identifier
   - `compute` (`TEXT NOT NULL`) — GPU tier (`B200-192GB`, `H100-80GB`, `A100-80GB`, `L40S-48GB`)
   - `region` (`TEXT NOT NULL`) — Edge routing fabric (`iad-1`, `sfo-1`, `fra-1`, `hnd-1`)
   - `status` (`TEXT NOT NULL`) — Lifecycle state (`LIVE`, `PROVISIONING`, `HIBERNATED`, `DEGRADED`)
   - `replicas` (`INTEGER NOT NULL`) — Active GPU node count (`0` to `16`)
   - `max_batch_size` (`INTEGER NOT NULL`) — Concurrent sequence batch limit
   - `quantization` (`TEXT NOT NULL`) — Tensor precision (`FP8`, `FP16`, `INT4-AWQ`)
   - `latency_p95_ms`, `tokens_per_sec`, `requests_24h`, `cost_per_hour`, `uptime_pct` (`REAL`/`INTEGER`)
   - `env_vars_json` & `telemetry_history_json` (`TEXT NOT NULL`) — Serialized engine flags & 12-point sparkline array

---

## 3. Public API Integration (Hugging Face Hub API)

Via `src/app/api/hf-models/route.ts`, VORTEX integrates directly with the public **Hugging Face Hub API** (`https://huggingface.co/api/models`):
- Fetches live trending `text-generation` models sorted by download velocity, or searches any query (`?q=mistral`, `?q=deepseek`, `?q=llama`, etc.).
- Automatically inspects model parameter sizes and tags to recommend the optimal GPU tier (`B200-192GB` for 70B+/R1 models, `H100-80GB` for 32B–70B, `A100-80GB` for diffusion, `L40S-48GB` for audio/speech) and quantization (`FP8`, `FP16`, `INT4-AWQ`).
- Includes an automatic offline fallback catalog so the app remains 100% functional even in air-gapped or firewalled environments.

---

## 4. Prerequisites & System Requirements

- **Operating System**: Linux, macOS, or Windows (WSL2 recommended)
- **Node.js**: `v22.5.0+` (or `v24+` / `v26+`) which includes the native `node:sqlite` SQLite engine out of the box
- **Package Manager**: `npm` (v10+)

Verify your Node.js and npm versions:
```bash
node -v
npm -v
```

---

## 5. Installation & How to Run

### Step 1: Clone or Navigate to the Project Directory
```bash
cd /home/spktr/Projects/GyorfiDaniel
```

### Step 2: Install Dependencies
Install all required packages (`next`, `react`, `react-dom`, `lucide-react`, `tailwindcss`, `typescript`):
```bash
npm install
```

### Step 3: Start the Development Server
```bash
npm run dev
```
The server will start on **[http://localhost:3000](http://localhost:3000)**.
On first request, the SQLite database (`.data/vortex.sqlite`) is automatically initialized and seeded with 5 frontier GPU deployments and a founder demo user.

### Step 4: Production Build & Start (Optional)
To verify TypeScript types and run an optimized production build:
```bash
npm run build
npm run start
```

---

## 6. Project Directory Structure

```text
.
├── .data/
│   └── vortex.sqlite                         # Auto-generated SQLite WAL database
├── src/
│   ├── lib/
│   │   └── db.ts                             # SQLite database schema, seed data & CRUD queries
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/route.ts                 # POST/GET authentication & cookie sessions
│   │   │   ├── deployments/route.ts          # GET all & POST create/reset deployments
│   │   │   ├── deployments/[id]/route.ts     # GET, PATCH, DELETE single deployment
│   │   │   └── hf-models/route.ts            # GET proxy to public Hugging Face Hub API
│   │   ├── globals.css                       # Obsidian theme, grid patterns, specular cards
│   │   ├── layout.tsx                        # Root layout & typography configuration
│   │   └── page.tsx                          # Session state orchestrator
│   └── components/
│       ├── AuthView.tsx                      # Split-screen Login / Register / Instant Demo UI
│       ├── DashboardView.tsx                 # Main Fleet Control Plane, KPIs, Filters & List
│       ├── DeploymentModal.tsx               # Create / Edit Modal with Live Hugging Face Search
│       └── InspectorDrawer.tsx               # Slide-over Inference Benchmark Sandbox & cURL tool
├── README.md                                 # Technical setup & architecture documentation
└── FUNCTIONALITIES.md                        # Comprehensive guide to website features & workflows
```
