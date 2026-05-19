import mongoose from "mongoose";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const { sessionId } = await params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError("Session not found.", 404);
    }

    await connectMongoDB();

    const consultingSession = await Booking.findById(sessionId).populate("serviceId").lean();
    if (!consultingSession) {
      throw new ApiError("Session not found.", 404);
    }

    const role = String(session.user.role ?? "");
    const isOwner = consultingSession.clientEmail === session.user.email;
    const isExpert = String(consultingSession.serviceId?.expertId ?? "") === session.user.id;

    if (role !== "admin" && !isOwner && !isExpert) {
      throw new ApiError("Forbidden.", 403);
    }

    return apiOk({ session: consultingSession });
  } catch (error) {
    return apiError(error);
  }
}
