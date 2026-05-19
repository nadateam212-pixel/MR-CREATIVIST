import { z } from "zod";
import { createAndSendAuthOtp, verifyAuthOtp } from "@/lib/auth-otp";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

const verifySchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/).optional(),
  purpose: z.enum(["login", "register"]).default("login"),
  action: z.enum(["send", "verify"]).default("verify")
});

export async function POST(request: Request) {
  try {
    const body = verifySchema.parse(await request.json());
    const email = body.email.toLowerCase();

    await connectMongoDB();
    const user = await User.findOne({ email }).select("_id name").lean();
    if (!user) throw new ApiError("No account exists for this email.", 404);

    if (body.action === "send") {
      const otp = await createAndSendAuthOtp(email, body.purpose, {
        userId: String(user._id),
        name: user.name
      });

      if (!otp.delivery.ok) {
        throw new ApiError(`${otp.delivery.message} Password sign-in is still available.`, 503);
      }

      return apiOk({ ok: true, message: "OTP sent to email.", emailDelivery: otp.delivery });
    }

    const code = body.code;
    if (!code) throw new ApiError("OTP code is required.", 422);

    const result = await verifyAuthOtp(email, body.purpose, code);
    if (!result.ok) throw new ApiError(result.message ?? "OTP verification failed.", 422);

    await User.updateOne({ _id: user._id }, { emailVerifiedAt: new Date() });

    return apiOk({ ok: true, message: "Email verified." });
  } catch (error) {
    return apiError(error);
  }
}
