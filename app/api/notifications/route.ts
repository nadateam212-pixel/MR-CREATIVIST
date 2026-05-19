import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();

    const items = await Notification.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(30).lean();

    return apiOk({ items: items.map((item) => ({ ...item, id: String(item._id) })) });
  } catch (error) {
    return apiError(error);
  }
}
