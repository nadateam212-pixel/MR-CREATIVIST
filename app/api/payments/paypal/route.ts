import { apiOk } from "@/lib/api";

export function POST() {
  return apiOk({ provider: "paypal", message: "PayPal order creation endpoint ready for credentials." });
}
