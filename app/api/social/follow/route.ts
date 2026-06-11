import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

const followSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(["follow", "unfollow"]).default("follow")
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new ApiError("Unauthorized.", 401);

    const body = followSchema.parse(await request.json());
    if (String(body.targetUserId) === String(session.user.id)) {
      throw new ApiError("You cannot follow your own account.", 422);
    }

    await connectMongoDB();
    const target = await User.findOne({ _id: body.targetUserId, accountStatus: { $ne: "suspended" } })
      .select("_id followers")
      .lean();
    if (!target) throw new ApiError("Account not found.", 404);

    if (body.action === "follow") {
      await Promise.all([
        User.updateOne({ _id: session.user.id }, { $addToSet: { following: target._id } }),
        User.updateOne({ _id: target._id }, { $addToSet: { followers: session.user.id } })
      ]);
    } else {
      await Promise.all([
        User.updateOne({ _id: session.user.id }, { $pull: { following: target._id } }),
        User.updateOne({ _id: target._id }, { $pull: { followers: session.user.id } })
      ]);
    }

    const updatedTarget = await User.findById(target._id).select("followers").lean();
    return apiOk({
      following: body.action === "follow",
      followerCount: updatedTarget?.followers?.length ?? 0,
      targetUserId: String(target._id)
    });
  } catch (error) {
    return apiError(error);
  }
}
