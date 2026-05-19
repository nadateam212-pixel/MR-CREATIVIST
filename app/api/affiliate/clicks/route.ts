import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("affiliate", "clicks");
}

export async function POST() {
  return resourceResponse("affiliate", "record-click", 201);
}
