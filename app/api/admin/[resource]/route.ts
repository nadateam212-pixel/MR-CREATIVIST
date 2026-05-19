import { auth } from "@/auth";
import { resourceResponse } from "@/lib/resource-api";

async function ensureAdmin() {
  const session = await auth();
  return session?.user?.role === "admin";
}

export async function GET(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!(await ensureAdmin())) return Response.json({ error: "Admin access required." }, { status: 403 });
  return resourceResponse(`admin:${resource}`, "admin-list");
}

export async function POST(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!(await ensureAdmin())) return Response.json({ error: "Admin access required." }, { status: 403 });
  return resourceResponse(`admin:${resource}`, "admin-create", 201);
}

export async function PATCH(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!(await ensureAdmin())) return Response.json({ error: "Admin access required." }, { status: 403 });
  return resourceResponse(`admin:${resource}`, "admin-update");
}

export async function DELETE(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!(await ensureAdmin())) return Response.json({ error: "Admin access required." }, { status: 403 });
  return resourceResponse(`admin:${resource}`, "admin-archive");
}
