import { apiOk } from "@/lib/api";

export async function POST() {
  return apiOk({ received: true, message: "Stripe webhook endpoint ready for signature verification." });
}
