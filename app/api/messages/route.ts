import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import { notifyUser } from "@/lib/notifications";
import ConsultingService from "@/models/ConsultingService";
import Gig from "@/models/Gig";
import Message from "@/models/Message";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";
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
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    isVerified: Boolean(user.isVerified)
  };
}

function otherParticipant(message: Record<string, unknown>, currentUserId: string) {
  const senderId = String(message.senderId);
  const receiverId = String(message.receiverId);
  return senderId === currentUserId ? receiverId : senderId;
}

function uniquePush(list: string[], value?: unknown) {
  const id = String(value ?? "");
  if (id && mongoose.Types.ObjectId.isValid(id) && !list.includes(id)) list.push(id);
}

function similarRoles(role?: string, validatedRoles: string[] = []) {
  const roles = new Set([role, ...validatedRoles].filter(Boolean));
  if (roles.has("admin")) return ["instructor", "seller", "freelancer", "consultant", "student", "client"];
  if (roles.has("instructor")) return ["student", "client", "freelancer"];
  if (roles.has("seller")) return ["client", "freelancer", "consultant"];
  if (roles.has("freelancer")) return ["client", "seller", "consultant"];
  if (roles.has("consultant")) return ["client", "seller", "freelancer"];
  return ["instructor", "seller", "freelancer", "consultant"];
}

async function searchableOwnerIds(q: string) {
  const term = new RegExp(q, "i");
  const [products, gigs, shops, services] = await Promise.all([
    Product.find({ status: { $ne: "archived" }, $or: [{ name: term }, { category: term }, { sellerName: term }, { type: term }, { tags: term }] })
      .select("sellerId")
      .limit(30)
      .lean(),
    Gig.find({ status: { $ne: "archived" }, $or: [{ title: term }, { category: term }, { packageName: term }, { ownerName: term }, { tags: term }] })
      .select("ownerId")
      .limit(30)
      .lean(),
    ShopProfile.find({ status: { $ne: "archived" }, $or: [{ name: term }, { category: term }, { ownerName: term }, { contactEmail: term }, { phone: term }, { tags: term }] })
      .select("ownerId")
      .limit(30)
      .lean(),
    ConsultingService.find({ status: { $ne: "archived" }, $or: [{ title: term }, { expertName: term }, { expertTitle: term }, { expertise: term }] })
      .select("expertId")
      .limit(30)
      .lean()
  ]);
  const ids: string[] = [];
  products.forEach((item) => uniquePush(ids, item.sellerId));
  gigs.forEach((item) => uniquePush(ids, item.ownerId));
  shops.forEach((item) => uniquePush(ids, item.ownerId));
  services.forEach((item) => uniquePush(ids, item.expertId));
  return ids;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const threadUserId = searchParams.get("userId");
    const q = searchParams.get("q")?.trim() ?? "";
    const summaryOnly = searchParams.get("summary") === "1";
    const currentUserId = String(session.user.id);

    if (summaryOnly) {
      const unreadCount = await Message.countDocuments({ receiverId: currentUserId, readAt: { $exists: false } });
      return apiOk({ unreadCount });
    }

    if (threadUserId && !mongoose.Types.ObjectId.isValid(threadUserId)) {
      throw new ApiError("Invalid user id.", 422);
    }

    if (threadUserId) {
      await Message.updateMany(
        { senderId: threadUserId, receiverId: currentUserId, readAt: { $exists: false } },
        { readAt: new Date() }
      );
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

    const [messages, latestMessages] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: threadUserId ? 1 : -1 })
        .limit(threadUserId ? 200 : 100)
        .lean(),
      Message.find({
        $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
      })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean()
    ]);

    const lastByUser = new Map<string, Record<string, unknown>>();
    const unreadByUser = new Map<string, number>();
    const orderedIds: string[] = [];

    latestMessages.forEach((message) => {
      const otherId = otherParticipant(message, currentUserId);
      const matchesSearch =
        !q ||
        `${message.subject ?? ""} ${message.contextType ?? ""} ${message.contextId ?? ""} ${message.content ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase());

      if (matchesSearch) uniquePush(orderedIds, otherId);
      if (!lastByUser.has(otherId)) {
        lastByUser.set(otherId, serializeMessage(message));
      }
      if (String(message.receiverId) === currentUserId && !message.readAt) {
        unreadByUser.set(otherId, (unreadByUser.get(otherId) ?? 0) + 1);
      }
    });

    uniquePush(orderedIds, threadUserId);

    let searchUsers: Record<string, unknown>[] = [];
    if (q) {
      const term = new RegExp(q, "i");
      const contentOwnerIds = await searchableOwnerIds(q);
      contentOwnerIds.forEach((id) => uniquePush(orderedIds, id));
      searchUsers = await User.find({
        _id: { $ne: currentUserId },
        accountStatus: { $ne: "suspended" },
        $or: [{ name: term }, { email: term }, { phone: term }, { role: term }]
      })
        .select("name email phone role profileImage isVerified")
        .sort({ name: 1 })
        .limit(40)
        .lean();
      searchUsers.forEach((user) => uniquePush(orderedIds, user._id));
    } else {
      const recommendedRoles = similarRoles(session.user.role, session.user.validatedRoles ?? []);
      const recommendedUsers = await User.find({
        _id: { $ne: currentUserId },
        accountStatus: { $ne: "suspended" },
        $or: [{ role: { $in: recommendedRoles } }, { validatedRoles: { $in: recommendedRoles } }]
      })
        .select("name email phone role profileImage isVerified")
        .sort({ isVerified: -1, lastLoginAt: -1, name: 1 })
        .limit(12)
        .lean();
      recommendedUsers.forEach((user) => uniquePush(orderedIds, user._id));
      searchUsers = recommendedUsers;
    }

    const directUserMap = new Map(searchUsers.map((user) => [String(user._id), user]));
    const missingIds = orderedIds.filter((id) => !directUserMap.has(id));
    const missingUsers = missingIds.length
      ? await User.find({ _id: { $in: missingIds, $ne: currentUserId }, accountStatus: { $ne: "suspended" } })
          .select("name email phone role profileImage isVerified")
          .lean()
      : [];
    missingUsers.forEach((user) => directUserMap.set(String(user._id), user));

    const contactUsers = orderedIds
      .map((id) => directUserMap.get(id))
      .filter((user): user is Record<string, unknown> => Boolean(user));

    const contacts = contactUsers.map((user) => {
      const serialized = serializeUser(user);

      return {
        ...serialized,
        lastMessage: lastByUser.get(serialized.id) ?? null,
        unreadCount: unreadByUser.get(serialized.id) ?? 0,
        source: lastByUser.has(serialized.id) ? "conversation" : q ? "search" : "recommended"
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

    await notifyUser({
      userId: body.receiverId,
      title: body.subject || "New message",
      body: `${session.user.name ?? "A user"} sent you a message.`,
      type: "message",
      metadata: {
        senderId: String(session.user.id),
        conversationKey: conversationKey(String(session.user.id), body.receiverId),
        contextType: body.contextType,
        contextId: body.contextId,
        url: `/messages/${session.user.id}`
      }
    });

    return apiOk(serializeMessage(message.toObject()), 201);
  } catch (error) {
    return apiError(error);
  }
}
