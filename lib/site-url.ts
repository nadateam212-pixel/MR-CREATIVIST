import { env } from "@/lib/env";

const productionUrl = "https://mrcreativist.vercel.app";

function normalizeUrl(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return "";
  }
}

function isLocalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getSiteUrl() {
  const vercelProductionUrl = env("VERCEL_PROJECT_PRODUCTION_URL")
    ? `https://${env("VERCEL_PROJECT_PRODUCTION_URL")}`
    : "";
  const vercelDeploymentUrl = env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "";
  const candidates = [
    env("NEXT_PUBLIC_APP_URL"),
    env("AUTH_URL"),
    env("NEXTAUTH_URL"),
    vercelProductionUrl,
    vercelDeploymentUrl,
    productionUrl
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (!normalized) continue;
    if (process.env.NODE_ENV === "production" && isLocalUrl(normalized)) continue;
    return normalized;
  }

  return productionUrl;
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function sameOriginRedirectPath(value?: string | null, fallback = "/dashboard") {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) return fallback;
  return trimmed;
}
