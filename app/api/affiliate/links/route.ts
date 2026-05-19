import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("affiliate", "links");
}

export async function POST() {
  return resourceResponse("affiliate", "create-link", 201);
}
