import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import { brand } from "@/lib/brand";
import PasswordResetToken from "@/models/PasswordResetToken";
import User from "@/models/User";

const RESET_TTL_MINUTES = 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function resetSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "mr-creativist-local-reset-secret";
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(`${token}:${resetSecret()}`).digest("hex");
}

function appBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://mrcreativist.vercel.app";
}

function resetEmailBody(name: string, resetUrl: string) {
  return {
    text: `Hi ${name}, reset your ${brand.name} password here: ${resetUrl}. This link expires in ${RESET_TTL_MINUTES} minutes. If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Reset your ${brand.name} password</h2>
        <p>Hi ${name}, use the secure link below to set a new password.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#2ec4a6;color:#06111f;padding:12px 18px;border-radius:6px;font-weight:700;text-decoration:none">Reset password</a></p>
        <p>This link expires in ${RESET_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `
  };
}

export async function createAndSendPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email);

  await connectMongoDB();
  const user = await User.findOne({ email: normalizedEmail }).select("_id name email").lean();

  if (!user) {
    return {
      ok: true,
      userFound: false,
      delivery: { ok: true, provider: "none" as const, message: "If an account exists, a reset link will be sent." }
    };
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60_000);

  await PasswordResetToken.updateMany(
    { userId: user._id, usedAt: { $exists: false } },
    { usedAt: new Date() }
  );

  await PasswordResetToken.create({
    userId: user._id,
    email: normalizedEmail,
    tokenHash: hashToken(token),
    expiresAt,
    metadata: { purpose: "password-reset" }
  });

  const resetUrl = `${appBaseUrl()}/reset-password/${encodeURIComponent(token)}`;
  const body = resetEmailBody(user.name || "there", resetUrl);
  const delivery = await sendEmail({
    to: normalizedEmail,
    subject: `Reset your ${brand.name} password`,
    text: body.text,
    html: body.html
  });

  return { ok: delivery.ok, userFound: true, delivery, resetUrl, expiresAt };
}

export async function resetPasswordWithToken(token: string, password: string) {
  await connectMongoDB();

  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(token),
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!record) {
    return { ok: false, message: "This reset link is invalid or expired." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findByIdAndUpdate(
    record.userId,
    {
      $set: {
        passwordHash,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date()
      },
      $addToSet: { authProviders: "credentials" }
    },
    { returnDocument: "after" }
  ).lean();

  if (!user) {
    record.usedAt = new Date();
    await record.save();
    return { ok: false, message: "This reset link is no longer valid." };
  }

  record.usedAt = new Date();
  await record.save();

  await sendEmail({
    to: record.email,
    subject: `${brand.name} password changed`,
    text: `Your ${brand.name} password was changed. If this was not you, contact support immediately.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Password changed</h2>
        <p>Your ${brand.name} password was changed. If this was not you, contact support immediately.</p>
      </div>
    `
  });

  return { ok: true, email: record.email };
}
