import crypto from "node:crypto";
import { env } from "@/lib/env";
import connectMongoDB from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import AuthOtp from "@/models/AuthOtp";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 6;

export type AuthOtpPurpose = "login" | "register";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function otpSecret() {
  return env("AUTH_SECRET") || env("NEXTAUTH_SECRET") || "mr-creativist-local-otp-secret";
}

function hashOtp(email: string, purpose: AuthOtpPurpose, code: string) {
  return crypto.createHash("sha256").update(`${normalizeEmail(email)}:${purpose}:${code}:${otpSecret()}`).digest("hex");
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function otpSubject(purpose: AuthOtpPurpose) {
  return purpose === "register" ? "Verify your MR Creativist account" : "Your MR Creativist sign-in code";
}

function otpBody(code: string, purpose: AuthOtpPurpose) {
  const action = purpose === "register" ? "finish creating your account" : "finish signing in";

  return {
    text: `Your MR Creativist verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes. Use it to ${action}.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">MR Creativist verification</h2>
        <p>Use this code to ${action}:</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:8px;margin:20px 0">${code}</p>
        <p>This code expires in ${OTP_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `
  };
}

export async function createAndSendAuthOtp(email: string, purpose: AuthOtpPurpose, metadata: Record<string, unknown> = {}) {
  const normalizedEmail = normalizeEmail(email);
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await connectMongoDB();
  await AuthOtp.updateMany({ email: normalizedEmail, purpose, consumedAt: { $exists: false } }, { consumedAt: new Date() });
  await AuthOtp.create({
    email: normalizedEmail,
    purpose,
    codeHash: hashOtp(normalizedEmail, purpose, code),
    expiresAt,
    metadata
  });

  const body = otpBody(code, purpose);
  const delivery = await sendEmail({
    to: normalizedEmail,
    subject: otpSubject(purpose),
    text: body.text,
    html: body.html
  });

  return { email: normalizedEmail, expiresAt, delivery };
}

export async function verifyAuthOtp(email: string, purpose: AuthOtpPurpose, code: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = code.trim();

  await connectMongoDB();

  const record = await AuthOtp.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) {
    return { ok: false, message: "The code expired. Request a new OTP and try again." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.consumedAt = new Date();
    await record.save();
    return { ok: false, message: "Too many OTP attempts. Request a new code." };
  }

  record.attempts += 1;
  const valid = record.codeHash === hashOtp(normalizedEmail, purpose, normalizedCode);

  if (!valid) {
    await record.save();
    return { ok: false, message: "The OTP code is not correct." };
  }

  record.consumedAt = new Date();
  await record.save();

  return { ok: true, email: normalizedEmail };
}
