import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("admin", "webhook-logs");
}

export async function POST() {
  return resourceResponse("admin", "webhook-replay", 202);
}
