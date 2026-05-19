import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("support", "reply-list");
}

export async function POST() {
  return resourceResponse("support", "reply-create", 201);
}
