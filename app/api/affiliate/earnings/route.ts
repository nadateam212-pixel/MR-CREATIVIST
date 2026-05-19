import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("affiliate", "earnings");
}

export async function POST() {
  return resourceResponse("affiliate", "record-earning", 201);
}
