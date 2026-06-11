import bcrypt from "bcryptjs";
import { createAndSendAuthOtp } from "@/lib/auth-otp";
import connectMongoDB from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, apiOk, ApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validations";
import User from "@/models/User";

function sanitizeRedirectTarget(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) return "";
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));
    const body = loginSchema.parse(raw);
    const normalizedEmail = body.email.toLowerCase().trim();
    const callbackUrl = sanitizeRedirectTarget(raw.callbackUrl) || "/dashboard";
    const limit = rateLimit(`api-login-start:${normalizedEmail}`, 8, 15 * 60_000);

    if (!limit.success) {
      throw new ApiError("Too many sign-in attempts. Try again later.", 429);
    }

    await connectMongoDB();
    const user = await User.findOne({ email: normalizedEmail })
      .select("+passwordHash name email role accountStatus")
      .lean();

    if (!user?.passwordHash || user.accountStatus === "suspended") {
      throw new ApiError("Email or password is incorrect.", 401);
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      throw new ApiError("Email or password is incorrect.", 401);
    }

    if (String(user.role ?? "").toLowerCase() === "admin") {
      return apiOk({
        requiresOtp: false,
        adminLogin: true,
        redirectTo: callbackUrl.startsWith("/admin") ? callbackUrl : "/admin/dashboard"
      });
    }

    const otp = await createAndSendAuthOtp(normalizedEmail, "login", {
      userId: String(user._id),
      name: user.name
    });

    if (!otp.delivery.ok) {
      throw new ApiError(otp.delivery.message || "OTP email could not be sent.", 503);
    }

    return apiOk({
      requiresOtp: true,
      verifyUrl: `/verify-otp?email=${encodeURIComponent(normalizedEmail)}&mode=login&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      emailDelivery: otp.delivery
    });
  } catch (error) {
    return apiError(error);
  }
}
