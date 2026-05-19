import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import User from "@/models/User";

const gigRequestSchema = z.object({
  ownerId: z.string().optional(),
  ownerName: z.string().max(120).optional(),
  gigSlug: z.string().min(1).max(160),
  gigTitle: z.string().min(2).max(180),
  gigPrice: z.string().max(80).optional(),
  requesterNote: z.string().max(1200).optional()
});

function conversationKey(left: string, right: string) {
  return [left, right].map(String).sort().join(":");
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Sign in to request this gig.", 401);

    const body = gigRequestSchema.parse(await request.json());

    await connectMongoDB();

    let receiverId = body.ownerId && mongoose.Types.ObjectId.isValid(body.ownerId) ? body.ownerId : "";
    if (!receiverId || receiverId === session.user.id) {
      const fallbackOwner = await User.findOne({
        _id: { $ne: session.user.id },
        $or: [{ role: "admin" }, { role: "freelancer" }, { validatedRoles: "freelancer" }]
      })
        .sort({ role: 1, createdAt: 1 })
        .select("_id name")
        .lean();

      if (!fallbackOwner) throw new ApiError("No freelancer contact is available for this gig yet.", 404);
      receiverId = String(fallbackOwner._id);
    }

    const subject = `Gig request: ${body.gigTitle}`;
    const content = [
      `${session.user.name ?? "A client"} requested the gig "${body.gigTitle}".`,
      body.gigPrice ? `Budget/package: ${body.gigPrice}.` : "",
      body.requesterNote ? `Client note: ${body.requesterNote}` : "Please reply here to start the project chat."
    ]
      .filter(Boolean)
      .join("\n");

    const message = await Message.create({
      senderId: session.user.id,
      receiverId,
      conversationKey: conversationKey(String(session.user.id), receiverId),
      subject,
      content,
      contextType: "gig",
      contextId: body.gigSlug
    });

    await Notification.create({
      userId: receiverId,
      title: subject,
      body: `${session.user.name ?? "A client"} wants to start a gig conversation.`,
      type: "message",
      metadata: {
        senderId: String(session.user.id),
        contextType: "gig",
        contextId: body.gigSlug,
        ownerName: body.ownerName
      }
    });

    return apiOk({
      ok: true,
      threadUrl: `/messages/${receiverId}`,
      receiverId,
      messageId: String(message._id)
    });
  } catch (error) {
    return apiError(error);
  }
}
