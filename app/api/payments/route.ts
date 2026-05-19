import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("payments", "methods");
}

export async function POST() {
  return resourceResponse("payments", "intent", 201);
}
