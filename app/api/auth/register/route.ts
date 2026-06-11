import bcrypt from "bcryptjs";
import { createAndSendAuthOtp } from "@/lib/auth-otp";
import connectMongoDB from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, apiOk, ApiError } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import ReferralProfile from "@/models/ReferralProfile";
import User from "@/models/User";

const defaultValidatedRoles = ["client", "student", "instructor", "seller", "freelancer", "consultant"];

function normalizeReferralCode(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return (
      url.searchParams.get("referral") ||
      url.searchParams.get("ref") ||
      url.searchParams.get("code") ||
      ""
    )
      .trim()
      .toUpperCase();
  } catch {
    return raw.replace(/[^a-z0-9-]+/gi, "").toUpperCase();
  }
}

function referralCodeFor(email: string) {
  const local = email.split("@")[0]?.replace(/[^a-z0-9]+/gi, "").slice(0, 8).toUpperCase() || "MRC";
  return `MRC-${local}`;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const body = registerSchema.parse(raw);
    const normalizedEmail = body.email.toLowerCase();
    const callbackUrl =
      typeof raw.callbackUrl === "string" && raw.callbackUrl.startsWith("/") && !raw.callbackUrl.startsWith("//") && !raw.callbackUrl.includes("://")
        ? raw.callbackUrl
        : "/dashboard";
    const limit = rateLimit(`api-register:${normalizedEmail}`, 5, 60 * 60_000);

    if (!limit.success) {
      throw new ApiError("Too many registration attempts. Try again later.", 429);
    }

    await connectMongoDB();
    const referralCode = normalizeReferralCode(body.referral);
    const referrer = referralCode
      ? await ReferralProfile.findOne({ code: referralCode, status: "active" })
          .select("userId userEmail code")
          .lean()
      : null;

    const existingUser = await User.findOne({ email: normalizedEmail }).select("+passwordHash name email role emailVerifiedAt").lean();

    if (existingUser) {
      const validPassword = existingUser.passwordHash
        ? await bcrypt.compare(body.password, existingUser.passwordHash)
        : false;

      if (!validPassword) {
        throw new ApiError("An account already exists for this email. Sign in instead.", 409);
      }

      const otp = !existingUser.emailVerifiedAt
        ? await createAndSendAuthOtp(existingUser.email, "register", {
            userId: String(existingUser._id),
            name: existingUser.name
          })
        : null;

      if (otp && !otp.delivery.ok) {
        throw new ApiError(otp.delivery.message || "OTP email could not be sent.", 503);
      }

      return apiOk({
        existing: true,
        requiresOtp: Boolean(otp?.delivery.ok),
        verifyUrl: otp?.delivery.ok
          ? `/verify-otp?email=${encodeURIComponent(existingUser.email)}&mode=register&callbackUrl=${encodeURIComponent(callbackUrl)}`
          : null,
        emailDelivery: otp?.delivery ?? {
          ok: true,
          provider: "none",
          message: "Existing account can continue with password sign-in."
        },
        user: {
          id: String(existingUser._id),
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        }
      });
    }

    const user = await User.create({
      name: body.name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(body.password, 12),
      role: "client",
      validatedRoles: defaultValidatedRoles,
      authProviders: ["credentials"],
      ...(referrer && referrer.userEmail !== normalizedEmail
        ? {
            referredByUserId: referrer.userId,
            referredByEmail: referrer.userEmail,
            referredByCode: referrer.code,
            referredAt: new Date()
          }
        : {})
    });

    await ReferralProfile.findOneAndUpdate(
      { userEmail: normalizedEmail },
      {
        $setOnInsert: {
          userId: user._id,
          userEmail: normalizedEmail,
          code: referralCodeFor(normalizedEmail),
          commissionRate: 0.05,
          metadata: { source: "registration" }
        }
      },
      { upsert: true }
    );

    const otp = await createAndSendAuthOtp(user.email, "register", {
      userId: String(user._id),
      name: user.name
    });
    if (!otp.delivery.ok) {
      throw new ApiError(otp.delivery.message || "OTP email could not be sent.", 503);
    }
    await sendWelcomeEmail(user.email, user.name);

    return apiOk(
      {
        requiresOtp: otp.delivery.ok,
        verifyUrl: otp.delivery.ok
          ? `/verify-otp?email=${encodeURIComponent(user.email)}&mode=register&callbackUrl=${encodeURIComponent(callbackUrl)}`
          : null,
        emailDelivery: otp.delivery,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}
