import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("analytics", "export");
}

export async function POST() {
  return resourceResponse("analytics", "schedule-export", 201);
}
