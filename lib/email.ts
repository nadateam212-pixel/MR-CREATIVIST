import { Resend } from "resend";
import { brand } from "@/lib/brand";

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailDeliveryResult = {
  ok: boolean;
  provider: "resend" | "console" | "none";
  message: string;
};

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || `${brand.name} <onboarding@resend.dev>`;
}

export async function sendEmail({ to, subject, text, html }: EmailInput): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        provider: "none",
        message: "Email provider is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel."
      };
    }

    console.info(`[email:dev] To: ${to}\nSubject: ${subject}\n${text}`);
    return { ok: true, provider: "console", message: "Email was logged in the development server console." };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      text,
      html
    });

    return { ok: true, provider: "resend", message: "Email sent." };
  } catch (error) {
    console.error("[email] Failed to send email", error);
    return {
      ok: false,
      provider: "resend",
      message: "Email provider rejected the message. Check sender domain and API key."
    };
  }
}
