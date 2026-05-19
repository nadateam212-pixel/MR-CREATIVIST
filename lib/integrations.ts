export const integrations = {
  payments: ["stripe-connect", "paypal", "mobile-money", "lemon-squeezy"],
  media: ["s3-compatible-storage", "mux", "cloudflare-r2", "imgix"],
  realtime: ["pusher", "supabase-realtime", "livekit"],
  analytics: ["vercel-analytics", "speed-insights", "posthog", "sentry", "opentelemetry"],
  notifications: ["resend", "react-email", "courier", "slack", "discord"],
  ai: ["gemini", "ai-sdk", "recommendations", "quiz-generation", "course-copilot"],
  automation: ["webhooks", "zapier", "google-calendar", "zoom", "meet"]
} as const;

export function isConfigured(name: string) {
  return Boolean(process.env[name]);
}
