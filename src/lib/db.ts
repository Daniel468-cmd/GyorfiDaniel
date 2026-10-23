import { promises as fs } from "fs";
import path from "path";

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

interface DatabaseSchema {
  users: UserRecord[];
  deployments: Deployment[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "vortex-db.json");

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
      { key: "KV_CACHE_DTYPE", value: "fp8_e4m3" }
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
      { key: "REASONING_TOKEN_BUDGET", value: "16384" }
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
      { key: "CUDA_GRAPH_CAPTURE", value: "1" }
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
      { key: "VAD_FILTER", value: "silero-v5" }
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
    costPerHour: 0.0,
    uptimePct: 99.8,
    envVars: [
      { key: "SCALE_TO_ZERO_IDLE_SEC", value: "300" },
      { key: "GUIDANCE_SCALE", value: "3.5" }
    ],
    telemetryHistory: [45, 48, 42, 30, 12, 0, 0, 0, 0, 0, 0, 0],
    createdAt: "2026-10-20T16:45:00Z",
    updatedAt: "2026-10-21T12:15:00Z",
  }
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
  }
];

async function ensureDb(): Promise<DatabaseSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    const initial: DatabaseSchema = {
      users: INITIAL_USERS,
      deployments: INITIAL_DEPLOYMENTS,
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

async function saveDb(data: DatabaseSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function calculateCostPerHour(compute: ComputeTier, replicas: number, status: DeploymentStatus): number {
  if (status === "HIBERNATED" || replicas === 0) return 0;
  const unitRates: Record<ComputeTier, number> = {
    "B200-192GB": 5.70,
    "H100-80GB": 3.45,
    "A100-80GB": 2.40,
    "L40S-48GB": 1.80,
  };
  return Number(((unitRates[compute] || 3.45) * replicas).toFixed(2));
}

export async function getDeployments(): Promise<Deployment[]> {
  const db = await ensureDb();
  return db.deployments;
}

export async function getDeploymentById(id: string): Promise<Deployment | undefined> {
  const db = await ensureDb();
  return db.deployments.find((d) => d.id === id);
}

export async function createDeployment(
  input: Omit<Deployment, "id" | "createdAt" | "updatedAt" | "costPerHour" | "telemetryHistory" | "requests24h" | "uptimePct">
): Promise<Deployment> {
  const db = await ensureDb();
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
      ? Array.from({ length: 12 }, (_, i) => Number((baseTps * (0.9 + ((i * 7) % 20) / 100)).toFixed(1)))
      : Array(12).fill(0),
    createdAt: now,
    updatedAt: now,
  };

  db.deployments.unshift(newDeployment);
  await saveDb(db);
  return newDeployment;
}

export async function updateDeployment(
  id: string,
  updates: Partial<Omit<Deployment, "id" | "createdAt">>
): Promise<Deployment | null> {
  const db = await ensureDb();
  const index = db.deployments.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const current = db.deployments[index];
  const nextCompute = updates.compute ?? current.compute;
  const nextStatus = updates.status ?? current.status;
  const nextReplicas = nextStatus === "HIBERNATED" ? 0 : (updates.replicas ?? (current.replicas === 0 ? 2 : current.replicas));

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

  db.deployments[index] = updated;
  await saveDb(db);
  return updated;
}

export async function deleteDeployment(id: string): Promise<boolean> {
  const db = await ensureDb();
  const prevLen = db.deployments.length;
  db.deployments = db.deployments.filter((d) => d.id !== id);
  if (db.deployments.length === prevLen) return false;
  await saveDb(db);
  return true;
}

export async function resetSeedDeployments(): Promise<Deployment[]> {
  const db = await ensureDb();
  db.deployments = JSON.parse(JSON.stringify(INITIAL_DEPLOYMENTS));
  await saveDb(db);
  return db.deployments;
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const db = await ensureDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  organization?: string;
}): Promise<UserRecord> {
  const db = await ensureDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
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

  db.users.push(newUser);
  await saveDb(db);
  return newUser;
}
