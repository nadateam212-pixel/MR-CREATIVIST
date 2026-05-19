import { apiOk } from "@/lib/api";
import { getEmailDeliveryStatus } from "@/lib/email";

function maskAddress(value: string) {
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => {
    const [name, domain] = email.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  });
}

export function GET() {
  const status = getEmailDeliveryStatus();

  return apiOk({
    ...status,
    from: maskAddress(status.from),
    help: status.canSend
      ? "OTP and password reset emails can be sent by the configured provider."
      : "Add RESEND_API_KEY or SMTP credentials in Vercel. Firebase web config does not send custom OTP/reset emails."
  });
}
