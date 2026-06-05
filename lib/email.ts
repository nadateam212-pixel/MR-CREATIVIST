import { Resend } from "resend";
import nodemailer from "nodemailer";
import { brand } from "@/lib/brand";
import { env, envBoolean, envNumber } from "@/lib/env";

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailDeliveryResult = {
  ok: boolean;
  provider: "resend" | "smtp" | "console" | "none";
  message: string;
};

function getFromAddress() {
  const mailFromAddress = env("MAIL_FROM_ADDRESS");
  const mailFromName = env("MAIL_FROM_NAME");
  const mailFrom = mailFromAddress ? `${mailFromName || brand.name} <${mailFromAddress}>` : "";

  return (
    env("EMAIL_FROM") ||
    env("RESEND_FROM_EMAIL") ||
    env("SMTP_FROM_EMAIL") ||
    mailFrom ||
    `${brand.name} <onboarding@resend.dev>`
  );
}

function getSmtpHost() {
  return env("SMTP_HOST") || env("MAIL_HOST");
}

function getSmtpPort() {
  return envNumber("SMTP_PORT", envNumber("MAIL_PORT", 587));
}

function getSmtpUser() {
  return env("SMTP_USER") || env("MAIL_USERNAME");
}

function getSmtpPassword() {
  return env("SMTP_PASSWORD") || env("MAIL_PASSWORD");
}

function getSmtpSecure() {
  const encryption = env("MAIL_ENCRYPTION").toLowerCase();
  if (encryption === "ssl") return true;
  if (encryption === "tls") return false;

  return envBoolean("SMTP_SECURE", false);
}

function isSmtpConfigured() {
  return Boolean(getSmtpHost() && getSmtpUser() && getSmtpPassword());
}

function getEmailSetupMessage() {
  return "Email provider is not configured. Add RESEND_API_KEY or SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_PORT, and EMAIL_FROM in Vercel.";
}

async function sendWithResend({ to, subject, text, html }: EmailInput): Promise<EmailDeliveryResult> {
  try {
    const resend = new Resend(env("RESEND_API_KEY"));
    const response = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      text,
      html
    });

    if (response.error) {
      return {
        ok: false,
        provider: "resend",
        message: response.error.message || "Resend rejected the message. Check sender domain and API key."
      };
    }

    return { ok: true, provider: "resend", message: "Email sent with Resend." };
  } catch (error) {
    console.error("[email:resend] Failed to send email", error);
    return {
      ok: false,
      provider: "resend",
      message: "Resend rejected the message. Check sender domain and API key."
    };
  }
}

async function sendWithSmtp({ to, subject, text, html }: EmailInput): Promise<EmailDeliveryResult> {
  try {
    const port = getSmtpPort();
    const transporter = nodemailer.createTransport({
      host: getSmtpHost(),
      port,
      secure: getSmtpSecure() || port === 465,
      auth: {
        user: getSmtpUser(),
        pass: getSmtpPassword()
      }
    });

    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html
    });

    return { ok: true, provider: "smtp", message: "Email sent with SMTP." };
  } catch (error) {
    console.error("[email:smtp] Failed to send email", error);
    return {
      ok: false,
      provider: "smtp",
      message: "SMTP rejected the message. Check host, port, username, password, and sender address."
    };
  }
}

export function getEmailDeliveryStatus() {
  return {
    canSend: Boolean(env("RESEND_API_KEY") || isSmtpConfigured()),
    providers: {
      resend: Boolean(env("RESEND_API_KEY")),
      smtp: isSmtpConfigured(),
      console: process.env.NODE_ENV !== "production"
    },
    from: getFromAddress(),
    message:
      env("RESEND_API_KEY") || isSmtpConfigured()
        ? "Email delivery is configured."
        : getEmailSetupMessage()
  };
}

export async function sendEmail(input: EmailInput): Promise<EmailDeliveryResult> {
  if (env("RESEND_API_KEY")) {
    const resendResult = await sendWithResend(input);
    if (resendResult.ok || !isSmtpConfigured()) return resendResult;
  }

  if (isSmtpConfigured()) {
    return sendWithSmtp(input);
  }

  if (process.env.NODE_ENV === "production") {
    return {
      ok: false,
      provider: "none",
      message: getEmailSetupMessage()
    };
  }

  const { to, subject, text } = input;
  console.info(`[email:dev] To: ${to}\nSubject: ${subject}\n${text}`);
  return { ok: true, provider: "console", message: "Email was logged in the development server console." };
}
