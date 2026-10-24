import { NextResponse } from "next/server";
import { updateDeployment, deleteDeployment, getDeploymentById } from "@/lib/db";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deployment = await getDeploymentById(id);
  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }
  return NextResponse.json({ deployment });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const updates = await req.json();
    const updated = await updateDeployment(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }
    return NextResponse.json({ deployment: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deleted = await deleteDeployment(id);
  if (!deleted) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
