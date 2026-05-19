import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import User from "@/models/User";

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid user id.");

const messageSchema = z.object({
  receiverId: objectIdSchema,
  content: z.string().min(1).max(5000),
  subject: z.string().max(180).optional(),
  contextType: z
    .enum(["direct", "offer", "product", "shop", "business", "gig", "job", "course", "support", "consulting"])
    .default("direct"),
  contextId: z.string().max(120).optional(),
  attachments: z.array(z.object({ label: z.string().max(120), url: z.url() })).default([])
});

function conversationKey(left: string, right: string) {
  return [left, right].map(String).sort().join(":");
}

function serializeMessage(message: Record<string, unknown>) {
  return {
    ...message,
    id: String(message._id),
    senderId: String(message.senderId),
    receiverId: String(message.receiverId)
  };
}

function serializeUser(user: Record<string, unknown>) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const threadUserId = searchParams.get("userId");
    const currentUserId = String(session.user.id);
    const usersPromise = User.find({ _id: { $ne: currentUserId }, accountStatus: { $ne: "suspended" } })
      .select("name email role profileImage")
      .sort({ name: 1 })
      .limit(100)
      .lean();

    if (threadUserId && !mongoose.Types.ObjectId.isValid(threadUserId)) {
      throw new ApiError("Invalid user id.", 422);
    }

    const filter = threadUserId
      ? {
          $or: [
            { conversationKey: conversationKey(currentUserId, threadUserId) },
            { senderId: currentUserId, receiverId: threadUserId },
            { senderId: threadUserId, receiverId: currentUserId }
          ]
        }
      : {
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
        };

    const [messages, users] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: threadUserId ? 1 : -1 })
        .limit(threadUserId ? 200 : 100)
        .lean(),
      usersPromise
    ]);

    if (threadUserId) {
      await Message.updateMany(
        { senderId: threadUserId, receiverId: currentUserId, readAt: { $exists: false } },
        { readAt: new Date() }
      );
    }

    const latestMessages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const lastByUser = new Map<string, Record<string, unknown>>();
    const unreadByUser = new Map<string, number>();

    latestMessages.forEach((message) => {
      const senderId = String(message.senderId);
      const receiverId = String(message.receiverId);
      const otherId = senderId === currentUserId ? receiverId : senderId;

      if (!lastByUser.has(otherId)) {
        lastByUser.set(otherId, serializeMessage(message));
      }
      if (receiverId === currentUserId && !message.readAt) {
        unreadByUser.set(otherId, (unreadByUser.get(otherId) ?? 0) + 1);
      }
    });

    const contacts = users.map((user) => {
      const serialized = serializeUser(user);

      return {
        ...serialized,
        lastMessage: lastByUser.get(serialized.id) ?? null,
        unreadCount: unreadByUser.get(serialized.id) ?? 0
      };
    });

    return apiOk({
      items: messages.map(serializeMessage),
      contacts,
      selectedUserId: threadUserId
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const body = messageSchema.parse(await request.json());

    await connectMongoDB();

    if (String(session.user.id) === body.receiverId) {
      throw new ApiError("Choose another user before sending a private message.", 422);
    }

    const receiver = await User.findOne({ _id: body.receiverId, accountStatus: { $ne: "suspended" } })
      .select("_id")
      .lean();

    if (!receiver) {
      throw new ApiError("Selected user is not available for private messages.", 404);
    }

    const message = await Message.create({
      senderId: session.user.id,
      receiverId: body.receiverId,
      conversationKey: conversationKey(String(session.user.id), body.receiverId),
      content: body.content,
      subject: body.subject,
      contextType: body.contextType,
      contextId: body.contextId,
      attachments: body.attachments
    });

    await Notification.create({
      userId: body.receiverId,
      title: body.subject || "New message",
      body: `${session.user.name ?? "A user"} sent you a message.`,
      type: "message",
      metadata: {
        senderId: String(session.user.id),
        conversationKey: conversationKey(String(session.user.id), body.receiverId),
        contextType: body.contextType,
        contextId: body.contextId
      }
    });

    return apiOk(serializeMessage(message.toObject()), 201);
  } catch (error) {
    return apiError(error);
  }
}
