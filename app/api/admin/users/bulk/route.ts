import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

const platformRole = z.enum(["student", "instructor", "seller", "client", "freelancer", "consultant", "admin"]);
const requestSchema = z.object({
  userIds: z.array(z.string()).min(1).max(100),
  action: z.enum(["verify", "activate", "suspend", "delete", "change_role"]),
  role: platformRole.optional()
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);
    if (session.user.role !== "admin") throw new ApiError("Admin access required.", 403);

    const body = requestSchema.parse(await request.json());
    if (body.action === "change_role" && !body.role) throw new ApiError("Choose a role for the selected users.", 400);

    const ids = Array.from(new Set(body.userIds)).filter((id) => mongoose.isValidObjectId(id));
    if (!ids.length) throw new ApiError("No valid users were selected.", 400);

    await connectMongoDB();
    const users = await User.find({ _id: { $in: ids } }).select("_id role validatedRoles").lean();
    const destructive = ["suspend", "delete", "change_role"].includes(body.action);
    const currentUserId = session.user.id ? String(session.user.id) : "";
    const protectedIds = users
      .filter((user) => destructive && (String(user._id) === currentUserId || user.role === "admin" || user.validatedRoles?.includes("admin")))
      .map((user) => String(user._id));
    const protectedSet = new Set(protectedIds);
    const affectedIds = users.map((user) => String(user._id)).filter((id) => !protectedSet.has(id));

    if (affectedIds.length) {
      if (body.action === "delete") {
        await User.deleteMany({ _id: { $in: affectedIds } });
      } else if (body.action === "verify") {
        await User.updateMany({ _id: { $in: affectedIds } }, { $set: { isVerified: true, emailVerifiedAt: new Date() } });
      } else if (body.action === "activate" || body.action === "suspend") {
        await User.updateMany({ _id: { $in: affectedIds } }, { $set: { accountStatus: body.action === "activate" ? "active" : "suspended" } });
      } else if (body.role) {
        await User.updateMany({ _id: { $in: affectedIds } }, { $set: { role: body.role }, $addToSet: { validatedRoles: body.role } });
      }
    }

    const protectedMessage = protectedIds.length ? ` ${protectedIds.length} administrator account(s) were protected.` : "";
    return apiOk({
      affectedIds,
      protectedIds,
      message: `${affectedIds.length} selected user account(s) updated.${protectedMessage}`
    });
  } catch (error) {
    return apiError(error);
  }
}
