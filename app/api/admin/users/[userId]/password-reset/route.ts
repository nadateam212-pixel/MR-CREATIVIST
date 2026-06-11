import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import { createAndSendPasswordReset } from "@/lib/password-reset";
import User from "@/models/User";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new ApiError("Unauthorized.", 401);
  if (session.user.role !== "admin") throw new ApiError("Admin access required.", 403);
  return session;
}

export async function POST(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdmin();
    const { userId } = await params;

    await connectMongoDB();
    const user = await User.findById(userId).select("email").lean();
    if (!user?.email) throw new ApiError("User not found.", 404);

    const result = await createAndSendPasswordReset(user.email);
    return apiOk({
      ok: result.ok,
      message: result.ok ? "Password reset link sent." : "Password reset email could not be sent."
    });
  } catch (error) {
    return apiError(error);
  }
}
