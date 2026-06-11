export const DATABASE_MEDIA_FALLBACK_IMAGE = "/icons/logo.png";

export function databaseMediaUrl(kind, record, fallback = DATABASE_MEDIA_FALLBACK_IMAGE) {
  const mediaKey = record?.slug ?? record?._id ?? record?.id;
  const mediaKind = String(kind ?? "").trim();

  if (!mediaKind || mediaKey === undefined || mediaKey === null || String(mediaKey).trim() === "") {
    return fallback;
  }

  return `/api/media/${encodeURIComponent(mediaKind)}/${encodeURIComponent(String(mediaKey))}`;
}
