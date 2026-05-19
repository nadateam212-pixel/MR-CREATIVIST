import { NextResponse } from "next/server";

const resourceCapabilities: Record<string, string[]> = {
  users: ["list", "read", "create", "update", "suspend", "assign-role", "activity", "export"],
  courses: ["list", "read", "create", "update", "publish", "approve", "enroll", "progress", "certificate"],
  products: ["list", "read", "create", "update", "inventory", "variants", "reviews", "fulfillment"],
  jobs: ["list", "read", "create", "update", "publish", "close", "applications", "matching"],
  shops: ["list", "read", "create", "update", "publish", "products", "services", "messaging"],
  orders: ["list", "read", "checkout", "refund", "tracking", "download", "invoice"],
  consulting: ["consultants", "availability", "booking", "confirmation", "session", "review", "payout"],
  wallet: ["balance", "transactions", "deposit", "transfer", "purchase", "refund", "withdrawal", "admin-adjustment"],
  affiliate: ["links", "clicks", "conversion", "commission", "payout", "fraud-check"],
  certificates: ["issue", "verify", "download", "share", "revoke", "bulk-issue"],
  analytics: ["overview", "cohorts", "revenue", "engagement", "exports", "audit"],
  support: ["tickets", "replies", "attachments", "priority", "assignment", "resolution"],
  blog: ["posts", "categories", "comments", "moderation", "likes", "seo"],
  payments: ["stripe", "paypal", "wallet", "webhooks", "refunds", "connect"],
  uploads: ["images", "videos", "documents", "validation", "metadata", "storage"],
  admin: ["users", "content", "finance", "reports", "settings", "health", "compliance"]
};

export function resourceResponse(resource: string, action: string, status = 200) {
  const normalized = resource.toLowerCase();
  const capabilities = resourceCapabilities[normalized] ?? ["list", "read", "create", "update", "delete"];

  return NextResponse.json(
    {
      resource: normalized,
      action,
      status: "ready",
      capabilities,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

export async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
