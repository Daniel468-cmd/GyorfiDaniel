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
  telemetryHistory: number[];
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
const DB_PATH = path.join(DATA_DIR, "vortex-db.json");

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
