import { NextResponse } from "next/server";
import Course from "@/models/Course";
import Gig from "@/models/Gig";
import Product from "@/models/Product";
import { mongoIdOrSlug, requireMongo } from "@/lib/mongo-api";
import { DATABASE_MEDIA_FALLBACK_IMAGE } from "@/lib/database-media";

const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
const MEDIA_MODELS = {
  courses: Course,
  gigs: Gig,
  products: Product
} as const;

type MediaKind = keyof typeof MEDIA_MODELS;

function headers(extra?: HeadersInit) {
  return {
    "Cache-Control": CACHE_CONTROL,
    ...extra
  };
}

function redirectTo(request: Request, target: string) {
  return NextResponse.redirect(new URL(target, request.url), {
    status: 302,
    headers: headers()
  });
}

function firstImage(record: Record<string, unknown>) {
  const directImage = typeof record.image === "string" ? record.image.trim() : "";
  const images = Array.isArray(record.images) ? record.images : [];
  const listImage = images.find((item): item is string => typeof item === "string" && item.trim().length > 0)?.trim() ?? "";

  return directImage || listImage;
}

function binaryImageResponse(source: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(source);
  if (!match) return null;

  try {
    return new NextResponse(new Uint8Array(Buffer.from(match[2], "base64")), {
      headers: headers({
        "Content-Type": match[1],
        "Content-Disposition": "inline"
      })
    });
  } catch {
    return null;
  }
}

function externalImageRedirect(source: string) {
  try {
    const url = new URL(source);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return NextResponse.redirect(url, {
      status: 302,
      headers: headers()
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: { params: Promise<{ kind: string; mediaId: string }> }) {
  const { kind, mediaId } = await context.params;

  if (!(kind in MEDIA_MODELS)) {
    return redirectTo(request, DATABASE_MEDIA_FALLBACK_IMAGE);
  }

  try {
    await requireMongo();
    const Model = MEDIA_MODELS[kind as MediaKind];
    const record = await Model.findOne({ ...mongoIdOrSlug(mediaId), status: { $ne: "archived" } })
      .select("image images updatedAt")
      .lean<Record<string, unknown> | null>();
    const source = record ? firstImage(record) : "";

    if (!source) return redirectTo(request, DATABASE_MEDIA_FALLBACK_IMAGE);
    if (source.startsWith("/")) return redirectTo(request, source);

    return binaryImageResponse(source) ?? externalImageRedirect(source) ?? redirectTo(request, DATABASE_MEDIA_FALLBACK_IMAGE);
  } catch {
    return redirectTo(request, DATABASE_MEDIA_FALLBACK_IMAGE);
  }
}
