import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return resourceResponse("admin", "backups");
}

export async function POST() {
  return resourceResponse("admin", "create-backup", 202);
}
