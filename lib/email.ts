import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";
import crypto from "node:crypto";
import { brand } from "@/lib/brand";
import { env, envBoolean, envNumber } from "@/lib/env";

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
};

export type EmailDeliveryResult = {
  ok: boolean;
  provider: "resend" | "smtp" | "console" | "none";
  message: string;
};

let smtpTransporter: Transporter | null = null;
let smtpTransporterKey = "";

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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

function getReplyToAddress() {
  return env("EMAIL_REPLY_TO") || env("MAIL_REPLY_TO") || brand.email;
}

function emailAddressFromHeader(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function getFromDomain() {
  const address = emailAddressFromHeader(getFromAddress());
  return address.includes("@") ? address.split("@").pop() || "" : "";
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

function transactionalHeaders(input?: Record<string, string>) {
  return {
    "X-Auto-Response-Suppress": "All",
    "X-MRCreativist-Mail": "transactional",
    ...input
  };
}

function messageId() {
  const domain = getFromDomain() || "mrcreativist.ca";
  return `<${crypto.randomUUID()}@${domain}>`;
}

function smtpTransportKey() {
  return [
    getSmtpHost(),
    getSmtpPort(),
    getSmtpSecure(),
    getSmtpUser(),
    getFromAddress()
  ].join("|");
}

function getSmtpTransporter(): Transporter {
  const key = smtpTransportKey();
  if (smtpTransporter && smtpTransporterKey === key) return smtpTransporter;

  const port = getSmtpPort();
  const secure = getSmtpSecure() || port === 465;
  const host = getSmtpHost();
  const options: SMTPPool.Options = {
    host,
    port,
    secure,
    pool: true,
    maxConnections: envNumber("SMTP_MAX_CONNECTIONS", 3),
    maxMessages: envNumber("SMTP_MAX_MESSAGES", 100),
    connectionTimeout: envNumber("SMTP_CONNECTION_TIMEOUT_MS", 8_000),
    greetingTimeout: envNumber("SMTP_GREETING_TIMEOUT_MS", 8_000),
    socketTimeout: envNumber("SMTP_SOCKET_TIMEOUT_MS", 12_000),
    requireTLS: !secure,
    tls: {
      minVersion: "TLSv1.2",
      servername: host
    },
    auth: {
      user: getSmtpUser(),
      pass: getSmtpPassword()
    }
  };

  smtpTransporter = nodemailer.createTransport(options);
  smtpTransporterKey = key;

  return smtpTransporter;
}

async function sendWithResend({ to, subject, text, html, replyTo, headers }: EmailInput): Promise<EmailDeliveryResult> {
  try {
    const resend = new Resend(env("RESEND_API_KEY"));
    const response = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
      replyTo: replyTo || getReplyToAddress(),
      headers: transactionalHeaders(headers)
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

async function sendWithSmtp({ to, subject, text, html, replyTo, headers, attachments }: EmailInput): Promise<EmailDeliveryResult> {
  try {
    const transporter = getSmtpTransporter();

    await transporter.sendMail({
      from: getFromAddress(),
      replyTo: replyTo || getReplyToAddress(),
      to,
      subject,
      text,
      html,
      messageId: messageId(),
      headers: transactionalHeaders(headers),
      attachments
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
  if (env("RESEND_API_KEY") && !input.attachments?.length) {
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
