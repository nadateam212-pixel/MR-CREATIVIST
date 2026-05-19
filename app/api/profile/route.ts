import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

const assetUrl = z.url().or(z.string().regex(/^\/[^\s]*$/, "Use a valid image URL or uploaded asset path.")).or(z.literal(""));

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().or(z.literal("")).transform((value) => value || undefined),
  location: z.string().max(160).optional().or(z.literal("")).transform((value) => value || undefined),
  bio: z.string().max(1200).optional().or(z.literal("")).transform((value) => value || undefined),
  profileImage: assetUrl.optional().transform((value) => value || undefined)
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();
    const body = profileSchema.parse(await request.json());
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: body.name,
        phone: body.phone,
        location: body.location,
        bio: body.bio,
        profileImage: body.profileImage
      },
      {
        new: true,
        runValidators: true
      }
    )
      .select("name email phone location bio profileImage role")
      .lean();

    if (!user) throw new ApiError("Profile not found.", 404);

    return apiOk({
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
      profileImage: user.profileImage ?? "",
      role: user.role
    });
  } catch (error) {
    return apiError(error);
  }
}
