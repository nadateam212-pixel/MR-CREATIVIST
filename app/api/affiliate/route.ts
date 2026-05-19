import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return Response.json({
    status: "ready",
    commissionSources: ["courses", "products", "consulting", "subscriptions"],
    tracking: ["referral-code", "affiliate-link", "click", "conversion", "commission", "payout"]
  });
}

export async function POST() {
  return resourceResponse("affiliate", "create-link", 201);
}
