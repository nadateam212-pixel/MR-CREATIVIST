import { resourceResponse } from "@/lib/resource-api";

export async function GET(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  return resourceResponse(resource, "list");
}

export async function POST(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  return resourceResponse(resource, "create", 201);
}

export async function PUT(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  return resourceResponse(resource, "replace");
}

export async function PATCH(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  return resourceResponse(resource, "update");
}

export async function DELETE(_: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  return resourceResponse(resource, "archive");
}
