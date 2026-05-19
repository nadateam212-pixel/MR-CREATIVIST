import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { friendlyMongoError, isMongoConnectionError } from "@/lib/mongodb";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500
  ) {
    super(message);
  }
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function zodErrorMessage(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";

  const path = issue.path.length ? issue.path.join(".") : "request";
  return `Invalid request: ${path} ${issue.message}`;
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({ error: zodErrorMessage(error), issues: error.issues }, { status: 422 });
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as { name?: string; code?: number; message?: string; status?: number };

    if (maybeError.name === "ValidationError") {
      return NextResponse.json({ error: "Invalid document." }, { status: 422 });
    }

    if (maybeError.code === 11000) {
      return NextResponse.json({ error: "A record with this unique field already exists." }, { status: 409 });
    }

    if (maybeError.status) {
      return NextResponse.json({ error: maybeError.message ?? "Request failed." }, { status: maybeError.status });
    }
  }

  if (isMongoConnectionError(error)) {
    return NextResponse.json({ error: friendlyMongoError(error), degraded: true }, { status: 503 });
  }

  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
