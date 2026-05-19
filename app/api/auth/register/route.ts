import bcrypt from "bcryptjs";
import { createAndSendAuthOtp } from "@/lib/auth-otp";
import connectMongoDB from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, apiOk, ApiError } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const normalizedEmail = body.email.toLowerCase();
    const limit = rateLimit(`api-register:${normalizedEmail}`, 5, 60 * 60_000);

    if (!limit.success) {
      throw new ApiError("Too many registration attempts. Try again later.", 429);
    }

    await connectMongoDB();

    if (await User.exists({ email: normalizedEmail })) {
      throw new ApiError("An account already exists for this email.", 409);
    }

    const user = await User.create({
      name: body.name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(body.password, 12),
      role: "client",
      validatedRoles: ["client"],
      authProviders: ["credentials"]
    });

    const otp = await createAndSendAuthOtp(user.email, "register", {
      userId: String(user._id),
      name: user.name
    });

    return apiOk(
      {
        requiresOtp: otp.delivery.ok,
        verifyUrl: otp.delivery.ok ? `/verify-otp?email=${encodeURIComponent(user.email)}&mode=register` : null,
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
