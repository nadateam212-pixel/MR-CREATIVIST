import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("payments", "webhook-log");
}

export async function POST() {
  return resourceResponse("payments", "webhook-received", 202);
}
