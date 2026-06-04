import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("summary") === "1") {
      const unreadCount = await Notification.countDocuments({ userId: session.user.id, readAt: { $exists: false } });
      return apiOk({ unreadCount });
    }

    const items = await Notification.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(30).lean();

    return apiOk({ items: items.map((item) => ({ ...item, id: String(item._id) })) });
  } catch (error) {
    return apiError(error);
  }
}
