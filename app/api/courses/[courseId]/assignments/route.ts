import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("courses", "assignments");
}

export async function POST() {
  return resourceResponse("courses", "submit-assignment", 201);
}
