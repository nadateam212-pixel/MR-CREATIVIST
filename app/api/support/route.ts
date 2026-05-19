import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("support", "tickets");
}

export async function POST() {
  return resourceResponse("support", "create-ticket", 201);
}
