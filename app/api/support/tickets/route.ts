import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("support", "ticket-list");
}

export async function POST() {
  return resourceResponse("support", "ticket-create", 201);
}
