import { apiOk } from "@/lib/api";

export function POST() {
  return apiOk({
    ok: true,
    message: "Verification endpoint ready for email OTP, badge OTP, and account verification flows."
  });
}
