import path from "path";
import fs from "fs";
import { DatabaseSync } from "node:sqlite";

export type DeploymentStatus = "LIVE" | "PROVISIONING" | "HIBERNATED" | "DEGRADED";
export type ComputeTier = "H100-80GB" | "B200-192GB" | "L40S-48GB" | "A100-80GB";
export type RegionCode = "iad-1" | "fra-1" | "hnd-1" | "sfo-1";

export interface EnvVar {
  key: string;
  value: string;
}

export interface Deployment {
  id: string;
  name: string;
  slug: string;
  model: string;
  compute: ComputeTier;
  region: RegionCode;
  status: DeploymentStatus;
  replicas: number;
  maxBatchSize: number;
  quantization: "FP16" | "FP8" | "INT4-AWQ";
  latencyP95Ms: number;
  tokensPerSec: number;
  requests24h: number;
  costPerHour: number;
  uptimePct: number;
  envVars: EnvVar[];
  telemetryHistory: number[]; // 12 points of TPS/Latency
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  passwordHash: string;
  apiKeyPrefix: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const SQLITE_DB_PATH = path.join(DATA_DIR, "vortex.sqlite");

const INITIAL_DEPLOYMENTS: Deployment[] = [
  {
    id: "dep_vtx_9921a",
    name: "llama-3.3-70b-instruct-prod",
    slug: "llama-3-3-70b-prod",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    compute: "H100-80GB",
    region: "iad-1",
    status: "LIVE",
    replicas: 4,
    maxBatchSize: 256,
    quantization: "FP8",
    latencyP95Ms: 28,
    tokensPerSec: 184.5,
    requests24h: 142890,
    costPerHour: 13.8,
    uptimePct: 99.99,
    envVars: [
      { key: "VLLM_ATTENTION_BACKEND", value: "FLASHINFER" },
      { key: "MAX_MODEL_LEN", value: "32768" },
      { key: "KV_CACHE_DTYPE", value: "fp8_e4m3" },
    ],
    telemetryHistory: [165, 172, 168, 180, 192, 178, 185, 190, 182, 188, 181, 184.5],
    createdAt: "2026-10-14T09:12:00Z",
    updatedAt: "2026-10-21T20:45:00Z",
  },
  {
    id: "dep_vtx_8840b",
    name: "deepseek-r1-distill-reasoning",
    slug: "deepseek-r1-reasoning",
    model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    compute: "B200-192GB",
    region: "sfo-1",
    status: "LIVE",
    replicas: 2,
    maxBatchSize: 512,
    quantization: "FP8",
    latencyP95Ms: 19,
    tokensPerSec: 312.8,
    requests24h: 289410,
    costPerHour: 11.4,
    uptimePct: 99.98,
    envVars: [
      { key: "ENABLE_SPECULATIVE_DECODING", value: "true" },
      { key: "REASONING_TOKEN_BUDGET", value: "16384" },
    ],
    telemetryHistory: [280, 295, 301, 290, 310, 305, 318, 322, 308, 315, 310, 312.8],
    createdAt: "2026-10-16T14:30:00Z",
    updatedAt: "2026-10-21T21:10:00Z",
  },
  {
    id: "dep_vtx_7102c",
    name: "qwen-2.5-coder-32b-copilot",
    slug: "qwen-coder-copilot",
    model: "Qwen/Qwen2.5-Coder-32B-Instruct",
    compute: "H100-80GB",
    region: "fra-1",
    status: "LIVE",
    replicas: 3,
    maxBatchSize: 128,
    quantization: "INT4-AWQ",
    latencyP95Ms: 22,
    tokensPerSec: 215.2,
    requests24h: 94120,
    costPerHour: 10.35,
    uptimePct: 99.95,
    envVars: [
      { key: "FIM_PREFIX_TOKEN", value: "<|fim_prefix|>" },
      { key: "CUDA_GRAPH_CAPTURE", value: "1" },
    ],
    telemetryHistory: [198, 204, 210, 208, 219, 212, 209, 221, 218, 214, 216, 215.2],
    createdAt: "2026-10-18T11:20:00Z",
    updatedAt: "2026-10-21T19:00:00Z",
  },
  {
    id: "dep_vtx_5419d",
    name: "whisper-large-v3-turbo-voice",
    slug: "whisper-v3-voice",
    model: "openai/whisper-large-v3-turbo",
    compute: "L40S-48GB",
    region: "hnd-1",
    status: "LIVE",
    replicas: 2,
    maxBatchSize: 64,
    quantization: "FP16",
    latencyP95Ms: 41,
    tokensPerSec: 420.0,
    requests24h: 67300,
    costPerHour: 3.6,
    uptimePct: 100.0,
    envVars: [
      { key: "STREAMING_CHUNK_MS", value: "200" },
      { key: "VAD_FILTER", value: "silero-v5" },
    ],
    telemetryHistory: [390, 405, 412, 400, 418, 425, 410, 415, 422, 419, 421, 420.0],
    createdAt: "2026-10-19T08:00:00Z",
    updatedAt: "2026-10-21T18:30:00Z",
  },
  {
    id: "dep_vtx_3091e",
    name: "flux-1-dev-image-synth-staging",
    slug: "flux-1-dev-staging",
    model: "black-forest-labs/FLUX.1-dev",
    compute: "A100-80GB",
    region: "iad-1",
    status: "HIBERNATED",
    replicas: 0,
    maxBatchSize: 16,
    quantization: "FP8",
    latencyP95Ms: 0,
    tokensPerSec: 0,
    requests24h: 4120,
    costPerHour: 0,
    uptimePct: 99.8,
    envVars: [
      { key: "SCALE_TO_ZERO_IDLE_SEC", value: "300" },
      { key: "GUIDANCE_SCALE", value: "3.5" },
    ],
    telemetryHistory: [45, 48, 42, 30, 12, 0, 0, 0, 0, 0, 0, 0],
    createdAt: "2026-10-20T16:45:00Z",
    updatedAt: "2026-10-21T12:15:00Z",
  },
];

const INITIAL_USERS: UserRecord[] = [
  {
    id: "usr_founder_01",
    name: "Daniel Gyorfi",
    email: "daniel@vortex.sh",
    role: "Staff Infrastructure Architect",
    organization: "Vortex Labs Inc.",
    passwordHash: "demo1234",
    apiKeyPrefix: "vtx_live_99a8f2c1",
    createdAt: "2026-09-01T00:00:00Z",
  },
];

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(SQLITE_DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      organization TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      api_key_prefix TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      model TEXT NOT NULL,
      compute TEXT NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL,
      replicas INTEGER NOT NULL,
      max_batch_size INTEGER NOT NULL,
      quantization TEXT NOT NULL,
      latency_p95_ms INTEGER NOT NULL,
      tokens_per_sec REAL NOT NULL,
      requests_24h INTEGER NOT NULL,
      cost_per_hour REAL NOT NULL,
      uptime_pct REAL NOT NULL,
      env_vars_json TEXT NOT NULL,
      telemetry_history_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default user if empty
  const userCountRow = db.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number };
  if (userCountRow.cnt === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, role, organization, password_hash, api_key_prefix, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of INITIAL_USERS) {
      insertUser.run(
        u.id,
        u.name,
        u.email,
        u.role,
        u.organization,
        u.passwordHash,
        u.apiKeyPrefix,
        u.createdAt
      );
    }
  }

  // Seed default deployments if empty
  const depCountRow = db.prepare("SELECT COUNT(*) as cnt FROM deployments").get() as { cnt: number };
  if (depCountRow.cnt === 0) {
    seedInitialDeployments(db);
  }

  dbInstance = db;
  return db;
}

function seedInitialDeployments(db: DatabaseSync) {
  const insertDep = db.prepare(`
    INSERT INTO deployments (
      id, name, slug, model, compute, region, status,
      replicas, max_batch_size, quantization, latency_p95_ms,
      tokens_per_sec, requests_24h, cost_per_hour, uptime_pct,
      env_vars_json, telemetry_history_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const d of INITIAL_DEPLOYMENTS) {
    insertDep.run(
      d.id,
      d.name,
      d.slug,
      d.model,
      d.compute,
      d.region,
      d.status,
      d.replicas,
      d.maxBatchSize,
      d.quantization,
      d.latencyP95Ms,
      d.tokensPerSec,
      d.requests24h,
      d.costPerHour,
      d.uptimePct,
      JSON.stringify(d.envVars),
      JSON.stringify(d.telemetryHistory),
      d.createdAt,
      d.updatedAt
    );
  }
}

interface DeploymentRow {
  id: string;
  name: string;
  slug: string;
  model: string;
  compute: ComputeTier;
  region: RegionCode;
  status: DeploymentStatus;
  replicas: number;
  max_batch_size: number;
  quantization: "FP16" | "FP8" | "INT4-AWQ";
  latency_p95_ms: number;
  tokens_per_sec: number;
  requests_24h: number;
  cost_per_hour: number;
  uptime_pct: number;
  env_vars_json: string;
  telemetry_history_json: string;
  created_at: string;
  updated_at: string;
}

function mapRowToDeployment(row: DeploymentRow): Deployment {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    model: row.model,
    compute: row.compute,
    region: row.region,
    status: row.status,
    replicas: Number(row.replicas),
    maxBatchSize: Number(row.max_batch_size),
    quantization: row.quantization,
    latencyP95Ms: Number(row.latency_p95_ms),
    tokensPerSec: Number(row.tokens_per_sec),
    requests24h: Number(row.requests_24h),
    costPerHour: Number(row.cost_per_hour),
    uptimePct: Number(row.uptime_pct),
    envVars: JSON.parse(row.env_vars_json || "[]"),
    telemetryHistory: JSON.parse(row.telemetry_history_json || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function calculateCostPerHour(
  compute: ComputeTier,
  replicas: number,
  status: DeploymentStatus
): number {
  if (status === "HIBERNATED" || replicas === 0) return 0;
  const unitRates: Record<ComputeTier, number> = {
    "B200-192GB": 5.7,
    "H100-80GB": 3.45,
    "A100-80GB": 2.4,
    "L40S-48GB": 1.8,
  };
  return Number(((unitRates[compute] || 3.45) * replicas).toFixed(2));
}

export async function getDeployments(): Promise<Deployment[]> {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM deployments ORDER BY datetime(created_at) DESC")
    .all() as unknown as DeploymentRow[];
  return rows.map(mapRowToDeployment);
}

export async function getDeploymentById(id: string): Promise<Deployment | undefined> {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM deployments WHERE id = ?")
    .get(id) as unknown as DeploymentRow | undefined;
  return row ? mapRowToDeployment(row) : undefined;
}

export async function createDeployment(
  input: Omit<
    Deployment,
    "id" | "createdAt" | "updatedAt" | "costPerHour" | "telemetryHistory" | "requests24h" | "uptimePct"
  >
): Promise<Deployment> {
  const db = getDb();
  const id = `dep_vtx_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const isLive = input.status === "LIVE" || input.status === "PROVISIONING";
  const baseTps = isLive ? input.tokensPerSec || 195.4 : 0;

  const newDeployment: Deployment = {
    ...input,
    id,
    costPerHour: calculateCostPerHour(input.compute, input.replicas, input.status),
    requests24h: isLive ? Math.floor(Math.random() * 15000) + 1200 : 0,
    uptimePct: 100.0,
    telemetryHistory: isLive
      ? Array.from({ length: 12 }, (_, i) =>
          Number((baseTps * (0.9 + ((i * 7) % 20) / 100)).toFixed(1))
        )
      : Array(12).fill(0),
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO deployments (
      id, name, slug, model, compute, region, status,
      replicas, max_batch_size, quantization, latency_p95_ms,
      tokens_per_sec, requests_24h, cost_per_hour, uptime_pct,
      env_vars_json, telemetry_history_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newDeployment.id,
    newDeployment.name,
    newDeployment.slug,
    newDeployment.model,
    newDeployment.compute,
    newDeployment.region,
    newDeployment.status,
    newDeployment.replicas,
    newDeployment.maxBatchSize,
    newDeployment.quantization,
    newDeployment.latencyP95Ms,
    newDeployment.tokensPerSec,
    newDeployment.requests24h,
    newDeployment.costPerHour,
    newDeployment.uptimePct,
    JSON.stringify(newDeployment.envVars),
    JSON.stringify(newDeployment.telemetryHistory),
    newDeployment.createdAt,
    newDeployment.updatedAt
  );

  return newDeployment;
}

export async function updateDeployment(
  id: string,
  updates: Partial<Omit<Deployment, "id" | "createdAt">>
): Promise<Deployment | null> {
  const db = getDb();
  const current = await getDeploymentById(id);
  if (!current) return null;

  const nextCompute = updates.compute ?? current.compute;
  const nextStatus = updates.status ?? current.status;
  const nextReplicas =
    nextStatus === "HIBERNATED"
      ? 0
      : updates.replicas ?? (current.replicas === 0 ? 2 : current.replicas);

  const nextTps =
    nextStatus === "HIBERNATED"
      ? 0
      : updates.tokensPerSec !== undefined
      ? updates.tokensPerSec
      : current.tokensPerSec === 0
      ? 180.0
      : current.tokensPerSec;

  const nextLatency =
    nextStatus === "HIBERNATED"
      ? 0
      : updates.latencyP95Ms !== undefined
      ? updates.latencyP95Ms
      : current.latencyP95Ms === 0
      ? 26
      : current.latencyP95Ms;

  const updated: Deployment = {
    ...current,
    ...updates,
    replicas: nextReplicas,
    status: nextStatus,
    tokensPerSec: nextTps,
    latencyP95Ms: nextLatency,
    costPerHour: calculateCostPerHour(nextCompute, nextReplicas, nextStatus),
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE deployments
    SET name = ?, slug = ?, model = ?, compute = ?, region = ?, status = ?,
        replicas = ?, max_batch_size = ?, quantization = ?, latency_p95_ms = ?,
        tokens_per_sec = ?, requests_24h = ?, cost_per_hour = ?, uptime_pct = ?,
        env_vars_json = ?, telemetry_history_json = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.slug,
    updated.model,
    updated.compute,
    updated.region,
    updated.status,
    updated.replicas,
    updated.maxBatchSize,
    updated.quantization,
    updated.latencyP95Ms,
    updated.tokensPerSec,
    updated.requests24h,
    updated.costPerHour,
    updated.uptimePct,
    JSON.stringify(updated.envVars),
    JSON.stringify(updated.telemetryHistory),
    updated.updatedAt,
    id
  );

  return updated;
}

export async function deleteDeployment(id: string): Promise<boolean> {
  const db = getDb();
  const result = db.prepare("DELETE FROM deployments WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

export async function resetSeedDeployments(): Promise<Deployment[]> {
  const db = getDb();
  db.exec("DELETE FROM deployments;");
  seedInitialDeployments(db);
  return getDeployments();
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  password_hash: string;
  api_key_prefix: string;
  created_at: string;
}

function mapRowToUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    organization: row.organization,
    passwordHash: row.password_hash,
    apiKeyPrefix: row.api_key_prefix,
    createdAt: row.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email) as unknown as UserRow | undefined;
  return row ? mapRowToUser(row) : undefined;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  organization?: string;
}): Promise<UserRecord> {
  const db = getDb();
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const newUser: UserRecord = {
    id: `usr_${Math.random().toString(36).substring(2, 9)}`,
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    role: "Principal AI Engineer",
    organization: input.organization?.trim() || "Stealth AI Labs",
    passwordHash: input.password,
    apiKeyPrefix: `vtx_live_${Math.random().toString(16).substring(2, 10)}`,
    createdAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO users (id, name, email, role, organization, password_hash, api_key_prefix, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newUser.id,
    newUser.name,
    newUser.email,
    newUser.role,
    newUser.organization,
    newUser.passwordHash,
    newUser.apiKeyPrefix,
    newUser.createdAt
  );

  return newUser;
}
