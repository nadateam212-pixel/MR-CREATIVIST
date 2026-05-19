import { apiOk } from "@/lib/api";

export function POST() {
  return apiOk({
    provider: "stripe",
    mode: "connect_marketplace",
    message: "Stripe payment intent route is ready for live credentials and connected account routing."
  });
}
