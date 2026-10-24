import { NextResponse } from "next/server";
import { getDeployments, createDeployment, resetSeedDeployments } from "@/lib/db";

export async function GET() {
  const deployments = await getDeployments();
  return NextResponse.json({ deployments });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "reset") {
      const deployments = await resetSeedDeployments();
      return NextResponse.json({ deployments });
    }

    const {
      name,
      model,
      compute = "H100-80GB",
      region = "iad-1",
      status = "LIVE",
      replicas = 2,
      maxBatchSize = 256,
      quantization = "FP8",
      envVars = [],
    } = body;

    if (!name || !model) {
      return NextResponse.json({ error: "Endpoint name and model identifier are required." }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const created = await createDeployment({
      name: name.trim(),
      slug: slug || `endpoint-${Date.now()}`,
      model: model.trim(),
      compute,
      region,
      status,
      replicas: Number(replicas) || 1,
      maxBatchSize: Number(maxBatchSize) || 128,
      quantization,
      latencyP95Ms: status === "HIBERNATED" ? 0 : Math.floor(Math.random() * 18) + 18,
      tokensPerSec: status === "HIBERNATED" ? 0 : Number((Math.random() * 140 + 165).toFixed(1)),
      envVars: Array.isArray(envVars) ? envVars : [],
    });

    return NextResponse.json({ deployment: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create deployment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
