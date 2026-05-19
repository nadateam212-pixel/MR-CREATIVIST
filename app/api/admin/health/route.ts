import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("admin", "health");
}
