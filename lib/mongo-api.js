import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { connectMongoDB, friendlyMongoError, hasMongoConfig, isMongoConnectionError } from "@/lib/mongodb";

export function jsonOk(data, status = 200) {
  return NextResponse.json(data, { status });
}

function zodErrorMessage(error) {
  const issue = error.issues?.[0];
  if (!issue) return "Invalid request.";

  const path = issue.path?.length ? issue.path.join(".") : "request";
  return `Invalid request: ${path} ${issue.message}`;
}

export function jsonError(error) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: zodErrorMessage(error), issues: error.issues }, { status: 422 });
  }

  if (error?.name === "ValidationError") {
    return NextResponse.json({ error: "Invalid document." }, { status: 422 });
  }

  if (error?.code === 11000) {
    return NextResponse.json({ error: "A record with this unique field already exists." }, { status: 409 });
  }

  if (error?.status) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isMongoConnectionError(error)) {
    return NextResponse.json({ error: friendlyMongoError(error), degraded: true }, { status: 503 });
  }

  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function requireMongo() {
  if (!hasMongoConfig()) {
    const error = new Error("MONGODB_URI is not configured.");
    error.status = 503;
    throw error;
  }

  return connectMongoDB();
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function requireAuthenticated() {
  const session = await auth();

  if (!session?.user) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  return session;
}

export async function requireRole(_request, allowedRoles = ["admin"]) {
  const session = await requireAuthenticated();
  const role = String(session.user.role ?? "").toLowerCase();

  if (session.user.accountStatus === "suspended") {
    const error = new Error("Account is suspended.");
    error.status = 403;
    throw error;
  }

  if (role !== "admin" && !allowedRoles.includes(role)) {
    const error = new Error("You do not have permission to perform this action.");
    error.status = 403;
    throw error;
  }

  return session;
}

export function mongoIdOrSlug(value) {
  return mongoose.Types.ObjectId.isValid(value) ? { _id: value } : { slug: value };
}

export function parsePagination(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 24)));
  const skip = (page - 1) * limit;

  return { page, limit, skip, q: searchParams.get("q")?.trim() };
}

export async function uniqueSlugFor(Model, baseSlug, excludeId) {
  let slug = baseSlug;
  let index = 2;

  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}
