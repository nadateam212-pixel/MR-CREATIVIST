import { apiOk } from "@/lib/api";

export function GET() {
  return apiOk({
    ok: true,
    service: "mr-creativist-nextjs",
    timestamp: new Date().toISOString()
  });
}
