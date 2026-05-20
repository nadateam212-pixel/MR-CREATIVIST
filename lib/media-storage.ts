import crypto from "node:crypto";
import { ApiError } from "@/lib/api";
import { env } from "@/lib/env";

type UploadOwner = {
  ownerType?: string;
  ownerId?: string;
  kind?: "image" | "video" | "audio" | "document" | "archive" | "other";
  title?: string;
  metadata?: Record<string, unknown>;
};

type HostedAsset = {
  provider: "cloudinary" | "vimeo";
  providerAssetId: string;
  url: string;
  secureUrl?: string;
  playbackUrl?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  format?: string;
  status?: string;
  metadata: Record<string, unknown>;
};

function cloudinaryConfig() {
  const url = env("CLOUDINARY_URL");

  if (url) {
    const parsed = new URL(url);
    return {
      cloudName: parsed.hostname,
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password)
    };
  }

  const cloudName = env("CLOUDINARY_CLOUD_NAME") ?? env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = env("CLOUDINARY_API_KEY");
  const apiSecret = env("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) return null;

  return { cloudName, apiKey, apiSecret };
}

function vimeoToken() {
  return env("VIMEO_ACCESS_TOKEN") ?? env("VIMEO_TOKEN");
}

function cloudinaryResourceType(kind: UploadOwner["kind"]) {
  if (kind === "image") return "image";
  if (kind === "video" || kind === "audio") return "video";

  return "raw";
}

export function mediaProvidersStatus() {
  return {
    cloudinary: Boolean(cloudinaryConfig()),
    vimeo: Boolean(vimeoToken())
  };
}

export function kindFromMime(mimeType: string, fallback: UploadOwner["kind"] = "other") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    mimeType.includes("epub") ||
    mimeType.startsWith("text/")
  ) {
    return "document";
  }
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "archive";

  return fallback;
}

function slugPart(value: unknown, fallback: string) {
  const slug = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);

  return slug || fallback;
}

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function cloudinaryThumbnail(secureUrl: string, resourceType?: string) {
  if (!secureUrl || resourceType === "raw") return "";

  return secureUrl.replace("/upload/", "/upload/c_fill,w_640,h_360,q_auto,f_jpg/");
}

export async function uploadToCloudinary(file: File, owner: UploadOwner): Promise<HostedAsset> {
  const config = cloudinaryConfig();
  if (!config) throw new ApiError("Cloudinary is not configured.", 503);

  const kind = kindFromMime(file.type, owner.kind);
  const resourceType = cloudinaryResourceType(kind);
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `mr-creativist/${slugPart(owner.ownerType, "general")}/${slugPart(owner.ownerId, "library")}`;
  const tags = ["mr-creativist", kind, slugPart(owner.ownerType, "general")].join(",");
  const signedParams = { folder, tags, timestamp };
  const signature = signCloudinaryParams(signedParams, config.apiSecret);
  const form = new FormData();

  form.set("file", file);
  form.set("api_key", config.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("tags", tags);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data?.error?.message ?? "Cloudinary upload failed.", response.status);
  }

  const secureUrl = String(data.secure_url ?? data.url ?? "");

  return {
    provider: "cloudinary",
    providerAssetId: String(data.public_id ?? ""),
    url: secureUrl,
    secureUrl,
    playbackUrl: resourceType === "video" ? secureUrl : undefined,
    thumbnailUrl: cloudinaryThumbnail(secureUrl, data.resource_type),
    width: typeof data.width === "number" ? data.width : undefined,
    height: typeof data.height === "number" ? data.height : undefined,
    durationSeconds: typeof data.duration === "number" ? data.duration : undefined,
    format: data.format,
    status: "ready",
    metadata: {
      ...owner.metadata,
      cloudName: config.cloudName,
      resourceType: data.resource_type,
      bytes: data.bytes,
      originalFilename: data.original_filename,
      signatureVersion: data.signature ? "signed" : "server-signed"
    }
  };
}

function bestVimeoThumbnail(video: Record<string, unknown>) {
  const pictures = video.pictures as { sizes?: { width?: number; link?: string; link_with_play_button?: string }[] } | undefined;
  const sizes = pictures?.sizes ?? [];
  const sorted = [...sizes].sort((left, right) => Number(right.width ?? 0) - Number(left.width ?? 0));

  return sorted[0]?.link_with_play_button ?? sorted[0]?.link ?? "";
}

export async function uploadToVimeo(file: File, owner: UploadOwner): Promise<HostedAsset> {
  const token = vimeoToken();
  if (!token) throw new ApiError("Vimeo is not configured.", 503);

  const createResponse = await fetch("https://api.vimeo.com/me/videos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.vimeo.*+json;version=3.4",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: owner.title ?? file.name,
      description: `MR Creativist lesson asset uploaded for ${owner.ownerType ?? "media"} ${owner.ownerId ?? "library"}.`,
      privacy: { view: "unlisted" },
      embed: { buttons: { like: false, share: false, watchlater: false }, logos: { vimeo: false } },
      upload: { approach: "tus", size: String(file.size) }
    })
  });
  const created = await createResponse.json().catch(() => ({}));

  if (!createResponse.ok) {
    throw new ApiError(created?.error ?? created?.message ?? "Vimeo upload session failed.", createResponse.status);
  }

  const uploadLink = created?.upload?.upload_link;
  if (!uploadLink) throw new ApiError("Vimeo did not return an upload link.", 502);

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadResponse = await fetch(uploadLink, {
    method: "PATCH",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Offset": "0",
      "Content-Type": "application/offset+octet-stream"
    },
    body: bytes
  });

  if (!uploadResponse.ok && uploadResponse.status !== 204) {
    throw new ApiError("Vimeo binary upload failed.", uploadResponse.status || 502);
  }

  const uri = String(created.uri ?? "");
  const vimeoId = uri.split("/").filter(Boolean).pop() ?? "";
  let video = created;

  if (uri) {
    const detailsResponse = await fetch(
      `https://api.vimeo.com${uri}?fields=uri,name,link,player_embed_url,pictures.sizes,duration,status,transcode.status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4"
        }
      }
    );

    if (detailsResponse.ok) {
      video = await detailsResponse.json();
    }
  }

  const embedUrl = String(video.player_embed_url ?? created.player_embed_url ?? (vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : ""));

  return {
    provider: "vimeo",
    providerAssetId: vimeoId || uri,
    url: embedUrl || String(video.link ?? ""),
    playbackUrl: String(video.link ?? created.link ?? ""),
    embedUrl,
    thumbnailUrl: bestVimeoThumbnail(video),
    durationSeconds: typeof video.duration === "number" ? video.duration : undefined,
    status: String(video?.transcode?.status ?? video.status ?? "uploading"),
    metadata: {
      ...owner.metadata,
      uri,
      uploadApproach: "tus",
      transcodeStatus: video?.transcode?.status,
      privacy: "unlisted"
    }
  };
}

export async function uploadHostedMedia(file: File, owner: UploadOwner): Promise<HostedAsset | null> {
  const kind = kindFromMime(file.type, owner.kind);

  if (kind === "video") {
    if (mediaProvidersStatus().vimeo) {
      try {
        return await uploadToVimeo(file, { ...owner, kind });
      } catch (error) {
        if (!mediaProvidersStatus().cloudinary) {
          throw error;
        }

        return uploadToCloudinary(file, {
          ...owner,
          kind,
          metadata: {
            ...owner.metadata,
            vimeoFallback: true,
            vimeoFallbackReason: error instanceof Error ? error.message : "Vimeo upload failed."
          }
        });
      }
    }

    if (mediaProvidersStatus().cloudinary) {
      return uploadToCloudinary(file, { ...owner, kind });
    }

    return null;
  }

  if (mediaProvidersStatus().cloudinary) {
    return uploadToCloudinary(file, { ...owner, kind });
  }

  return null;
}
