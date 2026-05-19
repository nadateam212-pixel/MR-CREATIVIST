import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import { normalizeRoles } from "@/lib/account-roles";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

const platformRole = z.enum(["student", "instructor", "seller", "client", "freelancer", "consultant", "admin"]);
const updateSchema = z.object({
  role: platformRole.optional(),
  validatedRoles: z.array(platformRole).optional(),
  accountStatus: z.enum(["active", "suspended", "review"]).optional()
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new ApiError("Unauthorized.", 401);
  if (session.user.role !== "admin") throw new ApiError("Admin access required.", 403);
  return session;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const body = updateSchema.parse(await request.json());

    await connectMongoDB();

    const patch: Record<string, unknown> = {};
    if (body.validatedRoles) {
      const roles = normalizeRoles(body.validatedRoles);
      if (body.role && !roles.includes(body.role)) roles.push(body.role);
      patch.validatedRoles = roles;
    }
    if (body.accountStatus) patch.accountStatus = body.accountStatus;
    if (body.role) patch.role = body.role;

    const user = await User.findByIdAndUpdate(userId, patch, { returnDocument: "after", runValidators: true }).lean();
    if (!user) throw new ApiError("User not found.", 404);

    return apiOk({ user: { ...user, id: String(user._id) } });
  } catch (error) {
    return apiError(error);
  }
}
