import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import { envNumber } from "@/lib/env";
import { kindFromMime, mediaProvidersStatus, uploadHostedMedia } from "@/lib/media-storage";
import connectMongoDB, { friendlyMongoError, isMongoConnectionError } from "@/lib/mongodb";
import { normalizedExternalVideoUrl } from "@/lib/video-sources";
import UploadAsset from "@/models/UploadAsset";

const LOCAL_FALLBACK_MAX_BYTES = 10 * 1024 * 1024;
const MAX_HOSTED_UPLOAD_BYTES = envNumber("MAX_HOSTED_UPLOAD_MB", 500) * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "text/plain",
  "application/epub+zip",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const uploadSchema = z.object({
  fileName: z.string().min(1).max(220),
  url: z.url(),
  kind: z.enum(["image", "video", "audio", "document", "archive", "other"]).default("other"),
  sizeBytes: z.coerce.number().int().min(0).default(0),
  provider: z.enum(["external", "cloudinary", "vimeo", "local"]).default("external"),
  secureUrl: z.url().optional(),
  playbackUrl: z.url().optional(),
  embedUrl: z.url().optional(),
  thumbnailUrl: z.url().optional(),
  providerAssetId: z.string().max(220).optional(),
  width: z.coerce.number().int().min(0).optional(),
  height: z.coerce.number().int().min(0).optional(),
  durationSeconds: z.coerce.number().min(0).optional(),
  status: z.enum(["ready", "uploading", "processing", "failed"]).default("ready"),
  ownerType: z.enum(["course", "product", "assignment", "project", "profile", "message", "general"]).default("general"),
  ownerId: z.string().max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const multipartUploadSchema = uploadSchema.omit({ url: true, fileName: true, sizeBytes: true }).extend({
  fileName: z.string().min(1).max(220).optional()
});

function normalizeAssetStatus(status?: string) {
  if (status === "complete" || status === "available" || status === "ready") return "ready";
  if (status === "uploading") return "uploading";
  if (status === "failed" || status === "error") return "failed";

  return "processing";
}

function transientUploadAsset(asset: Record<string, unknown>) {
  const id = `transient-${randomUUID()}`;

  return {
    ...asset,
    _id: id,
    id,
    transient: true
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();

    const items = await UploadAsset.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    return apiOk({
      providers: mediaProvidersStatus(),
      items: items.map((item) => ({ ...item, id: String(item._id) }))
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        throw new ApiError("Upload a valid document file.", 422);
      }

      if (file.size > MAX_HOSTED_UPLOAD_BYTES) {
        throw new ApiError(`File is too large. Upload files up to ${Math.round(MAX_HOSTED_UPLOAD_BYTES / 1024 / 1024)}MB.`, 413);
      }

      if (file.type && !allowedMimeTypes.has(file.type)) {
        throw new ApiError("Unsupported file type. Upload images, videos, audio, PDF, text, DOC, DOCX, EPUB, or ZIP files.", 415);
      }

      let metadata: Record<string, unknown> = {};
      const rawMetadata = formData.get("metadata");
      if (typeof rawMetadata === "string" && rawMetadata.trim()) {
        try {
          metadata = JSON.parse(rawMetadata) as Record<string, unknown>;
        } catch {
          throw new ApiError("Upload metadata is invalid.", 422);
        }
      }

      const body = multipartUploadSchema.parse({
        kind: formData.get("kind") ?? "document",
        ownerType: formData.get("ownerType") ?? "general",
        ownerId: formData.get("ownerId") ?? undefined,
        metadata,
        fileName: formData.get("fileName") ?? file.name
      });
      const detectedKind = kindFromMime(file.type, body.kind);
      const hosted = await uploadHostedMedia(file, {
        kind: detectedKind,
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        title: body.fileName || file.name,
        metadata
      });

      if (hosted) {
        const hostedAsset = {
          ...body,
          fileName: body.fileName || file.name,
          kind: detectedKind,
          url: hosted.url,
          secureUrl: hosted.secureUrl,
          playbackUrl: hosted.playbackUrl,
          embedUrl: hosted.embedUrl,
          thumbnailUrl: hosted.thumbnailUrl,
          provider: hosted.provider,
          providerAssetId: hosted.providerAssetId,
          sizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
          width: hosted.width,
          height: hosted.height,
          durationSeconds: hosted.durationSeconds,
          status: normalizeAssetStatus(hosted.status),
          metadata: hosted.metadata,
          userId: session.user.id
        };

        try {
          await connectMongoDB();
          const asset = await UploadAsset.create(hostedAsset);

          return apiOk({ asset: { ...asset.toObject(), data: undefined, id: String(asset._id) } }, 201);
        } catch (error) {
          if (isMongoConnectionError(error)) {
            return apiOk(
              {
                asset: transientUploadAsset(hostedAsset),
                degraded: true,
                warning: friendlyMongoError(error)
              },
              202
            );
          }

          throw error;
        }
      }

      if (detectedKind === "video") {
        throw new ApiError("Vimeo is not configured for video uploads.", 503);
      }

      if (file.size > LOCAL_FALLBACK_MAX_BYTES) {
        throw new ApiError("Cloudinary is not configured and this file is too large for local fallback storage.", 503);
      }

      await connectMongoDB();
      const data = Buffer.from(await file.arrayBuffer()).toString("base64");
      const asset = await UploadAsset.create({
        ...body,
        fileName: body.fileName || file.name,
        url: "/api/uploads/pending",
        provider: "local",
        kind: detectedKind,
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        data,
        userId: session.user.id
      });

      asset.url = `/api/uploads/${asset._id}`;
      await asset.save();

      return apiOk({ asset: { ...asset.toObject(), data: undefined, id: String(asset._id) } }, 201);
    }

    const body = uploadSchema.parse(await request.json());
    const normalizedVideo = body.kind === "video" ? normalizedExternalVideoUrl(body.url) : null;
    const externalAsset = {
      ...body,
      url: normalizedVideo?.url ?? body.url,
      embedUrl: body.embedUrl ?? normalizedVideo?.embedUrl,
      playbackUrl: body.playbackUrl ?? normalizedVideo?.playbackUrl,
      provider: body.provider ?? "external",
      metadata: normalizedVideo
        ? {
            ...body.metadata,
            videoProvider: normalizedVideo.provider,
            providerLabel: normalizedVideo.providerLabel
          }
        : body.metadata,
      userId: session.user.id
    };

    try {
      await connectMongoDB();
      const asset = await UploadAsset.create(externalAsset);

      return apiOk({ asset: { ...asset.toObject(), id: String(asset._id) } }, 201);
    } catch (error) {
      if (isMongoConnectionError(error)) {
        return apiOk(
          {
            asset: transientUploadAsset(externalAsset),
            degraded: true,
            warning: friendlyMongoError(error)
          },
          202
        );
      }

      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
