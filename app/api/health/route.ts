import { apiOk } from "@/lib/api";
import mongoose from "mongoose";
import { env, hasWrappingQuotes } from "@/lib/env";
import { connectMongoDB, friendlyMongoError, getMongoConnectionEnvName, hasMongoConfig } from "@/lib/mongodb";
import { getSiteUrl } from "@/lib/site-url";

function hasValue(name: string) {
  return Boolean(env(name));
}

function quotedEnvKeys() {
  return [
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "AUTH_TRUST_HOST",
    "AUTH_URL",
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "MONGODB_URI",
    "DATABASE_URL",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GEMINI_API_KEY"
  ].filter(hasWrappingQuotes);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeout = setTimeout(() => resolve(fallback), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function mongoPing() {
  if (!hasMongoConfig()) {
    return { ok: false, message: "MongoDB is not configured." };
  }

  return withTimeout(
    connectMongoDB()
      .then(async () => {
        await mongoose.connection.db?.admin().ping();
        return { ok: true, message: "MongoDB ping succeeded." };
      })
      .catch((error) => ({ ok: false, message: friendlyMongoError(error) })),
    4500,
    { ok: false, message: "MongoDB ping timed out." }
  );
}

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";

  return apiOk({
    ok: true,
    service: "mr-creativist-nextjs",
    timestamp: new Date().toISOString(),
    deployment: {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: env("VERCEL_ENV") || null,
      siteUrl: getSiteUrl()
    },
    env: {
      authSecret: hasValue("AUTH_SECRET") || hasValue("NEXTAUTH_SECRET"),
      authTrustHost: env("AUTH_TRUST_HOST").toLowerCase() === "true" || process.env.NODE_ENV === "production",
      authUrl: hasValue("AUTH_URL") || hasValue("NEXTAUTH_URL"),
      publicAppUrl: hasValue("NEXT_PUBLIC_APP_URL"),
      mongo: hasMongoConfig(),
      mongoSource: getMongoConnectionEnvName(),
      email:
        hasValue("RESEND_API_KEY") ||
        (hasValue("SMTP_HOST") && hasValue("SMTP_USER") && hasValue("SMTP_PASSWORD")),
      firebasePublic:
        hasValue("NEXT_PUBLIC_FIREBASE_API_KEY") &&
        hasValue("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") &&
        hasValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID") &&
        hasValue("NEXT_PUBLIC_FIREBASE_APP_ID"),
      gemini: hasValue("GOOGLE_GENERATIVE_AI_API_KEY") || hasValue("GEMINI_API_KEY"),
      cloudinary: hasValue("CLOUDINARY_CLOUD_NAME") && hasValue("CLOUDINARY_API_KEY") && hasValue("CLOUDINARY_API_SECRET"),
      vimeo: hasValue("VIMEO_CLIENT_ID") && hasValue("VIMEO_CLIENT_SECRET") && hasValue("VIMEO_ACCESS_TOKEN")
    },
    warnings: {
      quotedEnvKeys: quotedEnvKeys()
    },
    checks: deep
      ? {
          mongo: await mongoPing()
        }
      : undefined
  });
}
