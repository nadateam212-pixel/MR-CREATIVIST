import { apiOk } from "@/lib/api";
import { getMongoConnectionEnvName, hasMongoConfig } from "@/lib/mongodb";
import { getSiteUrl } from "@/lib/site-url";

function hasValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function GET() {
  return apiOk({
    ok: true,
    service: "mr-creativist-nextjs",
    timestamp: new Date().toISOString(),
    deployment: {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      siteUrl: getSiteUrl()
    },
    env: {
      authSecret: hasValue("AUTH_SECRET") || hasValue("NEXTAUTH_SECRET"),
      authTrustHost: process.env.AUTH_TRUST_HOST === "true",
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
    }
  });
}
