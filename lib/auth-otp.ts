import crypto from "node:crypto";
import { brand } from "@/lib/brand";
import { env } from "@/lib/env";
import connectMongoDB from "@/lib/mongodb";
import { escapeHtml, sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site-url";
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
  return purpose === "register" ? "Verify your Mr Creativist account" : "Your Mr Creativist sign-in code";
}

function otpBody(code: string, purpose: AuthOtpPurpose) {
  const action = purpose === "register" ? "finish creating your account" : "finish signing in";
  const dashboardUrl = absoluteUrl("/dashboard");
  const logoUrl = absoluteUrl(brand.logo);
  const safeAction = escapeHtml(action);

  return {
    text: `Your Mr Creativist verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes. Use it to ${action}. If this was not you, ignore this email or contact ${brand.email}.`,
    html: `
      <div style="margin:0;background:#f4f7fb;padding:28px 0;font-family:Arial,Helvetica,sans-serif;color:#101827">
        <div style="margin:0 auto;max-width:560px;background:#ffffff;border:1px solid #d9e5f6;border-radius:14px;overflow:hidden">
          <div style="padding:26px 30px 18px;border-bottom:1px solid #e5edf8">
            <img src="${logoUrl}" width="58" height="58" alt="${escapeHtml(brand.name)}" style="display:block;border-radius:12px;margin-bottom:16px" />
            <div style="font-size:12px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#1d5bd8">Secure account verification</div>
            <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#101827">Your verification code</h1>
          </div>
          <div style="padding:26px 30px 30px">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Use this code to ${safeAction} on ${escapeHtml(brand.name)}.</p>
            <div style="margin:22px 0;padding:18px 16px;border-radius:12px;background:#edf4ff;border:1px solid #bcd3ff;text-align:center;font-size:34px;font-weight:800;letter-spacing:8px;color:#0f4fd0">${code}</div>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#475569">This code expires in ${OTP_TTL_MINUTES} minutes. For your security, do not share it with anyone.</p>
            <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#475569">If you did not request this, you can safely ignore this email or contact support.</p>
            <a href="${dashboardUrl}" style="display:inline-block;background:#1d5bd8;color:#ffffff;padding:12px 18px;border-radius:8px;font-weight:700;text-decoration:none">Open Mr Creativist</a>
          </div>
          <div style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e5edf8;font-size:12px;line-height:1.6;color:#64748b">
            ${escapeHtml(brand.name)} · ${escapeHtml(brand.address)} · ${escapeHtml(brand.email)}
          </div>
        </div>
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
    html: body.html,
    headers: {
      "X-MRCreativist-Purpose": `auth-${purpose}`
    }
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
