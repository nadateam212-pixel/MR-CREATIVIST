import { resourceResponse } from "@/lib/resource-api";

export async function GET() {
  return Response.json({
    status: "ready",
    revenue: { courses: 128400, products: 64100, consulting: 23500, affiliatePayouts: 8400 },
    users: { newUsers: 1280, activeUsers: 48200, instructors: 640, sellers: 420, consultants: 180 },
    engagement: { enrollments: 9400, completions: 6016, orders: 3130, sessions: 780 }
  });
}

export async function POST() {
  return resourceResponse("analytics", "event", 201);
}
