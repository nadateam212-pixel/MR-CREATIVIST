import { auth } from "@/auth";
import Course from "@/models/Course";
import CourseCommunityLike from "@/models/CourseCommunityLike";
import CourseCommunityMessage from "@/models/CourseCommunityMessage";
import mongoose from "mongoose";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";
import { revalidatePublicContent } from "@/lib/public-revalidation";

type LeanCommunityMessage = Record<string, unknown> & {
  likedBy?: unknown[];
  parentId?: unknown;
  likeCount?: number;
};

type SerializedCommunityMessage = {
  id: string;
  courseId: string;
  courseSlug: unknown;
  parentId: string | null;
  senderId: string;
  senderName: unknown;
  senderEmail: unknown;
  senderRole: unknown;
  content: unknown;
  likes: number;
  liked: boolean;
  replies: SerializedCommunityMessage[];
  replyCount: number;
  isInstructor: boolean;
  isPinned: boolean;
  createdAt: unknown;
};

function userLiked(message: LeanCommunityMessage, userId?: string) {
  if (!userId || !Array.isArray(message.likedBy)) return false;
  return message.likedBy.some((item) => String(item) === String(userId));
}

function userObjectId(value?: unknown) {
  const id = String(value ?? "");
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

function serializeMessage(
  message: LeanCommunityMessage,
  userId?: string,
  likedMessageIds = new Set<string>(),
  replies: SerializedCommunityMessage[] = []
): SerializedCommunityMessage {
  return {
    id: String(message._id ?? message.id),
    courseId: String(message.courseId),
    courseSlug: message.courseSlug,
    parentId: message.parentId ? String(message.parentId) : null,
    senderId: String(message.senderId),
    senderName: message.senderName,
    senderEmail: message.senderEmail,
    senderRole: message.senderRole,
    content: message.content,
    likes: Number(message.likeCount ?? message.likedBy?.length ?? 0),
    liked: likedMessageIds.has(String(message._id ?? message.id)) || userLiked(message, userId),
    replies,
    replyCount: replies.length,
    isInstructor: Boolean(message.isInstructor),
    isPinned: Boolean(message.isPinned),
    createdAt: message.createdAt
  };
}

function activeMessageFilter(courseId: unknown) {
  return {
    courseId,
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
  };
}

async function ensureLegacyMessageLikes(message: LeanCommunityMessage) {
  if (!Array.isArray(message.likedBy) || !message.likedBy.length) return;

  const operations = message.likedBy
    .map((item) => userObjectId(item))
    .filter(Boolean)
    .map((userId) => ({
      updateOne: {
        filter: { messageId: message._id, userId },
        update: {
          $setOnInsert: {
            courseId: message.courseId,
            messageId: message._id,
            userId
          }
        },
        upsert: true
      }
    }));

  if (operations.length) {
    await CourseCommunityLike.bulkWrite(operations, { ordered: false }).catch(() => undefined);
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();

    const { courseId } = await params;
    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("_id slug title instructorId instructorName").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const messages = await CourseCommunityMessage.find(activeMessageFilter(course._id))
      .sort({ isPinned: -1, createdAt: 1 })
      .limit(200)
      .lean();
    const userId = String(session?.user?.id ?? "");
    const userIdObject = userObjectId(userId);
    const messageIds = messages.map((message) => message._id);
    const likedMessageIds = new Set(
      userIdObject
        ? (
            await CourseCommunityLike.find({ messageId: { $in: messageIds }, userId: userIdObject })
              .select("messageId")
              .lean()
          ).map((item) => String(item.messageId))
        : []
    );
    const replyBuckets = new Map<string, SerializedCommunityMessage[]>();
    const roots: SerializedCommunityMessage[] = [];

    for (const message of messages) {
      if (!message.parentId) continue;
      const parentKey = String(message.parentId);
      const replies = replyBuckets.get(parentKey) ?? [];
      replies.push(serializeMessage(message, userId, likedMessageIds));
      replyBuckets.set(parentKey, replies);
    }

    for (const message of messages) {
      if (message.parentId) continue;
      const id = String(message._id ?? message.id);
      roots.push(serializeMessage(message, userId, likedMessageIds, replyBuckets.get(id) ?? []));
    }

    const isInstructor = Boolean(
      session?.user &&
        (String(course.instructorId ?? "") === String(session.user.id ?? "") ||
          String(course.instructorName ?? "").toLowerCase() === String(session.user.name ?? "").toLowerCase() ||
          ["admin", "instructor"].includes(String(session.user.role ?? "")))
    );

    return jsonOk({
      course: { id: String(course._id), slug: course.slug, title: course.title },
      isInstructor,
      items: roots
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    if (!session?.user) return jsonOk({ error: "Authentication required." }, 401);

    const { courseId } = await params;
    const body = await readJson(request);
    const content = String(body?.content ?? "").trim();
    if (!content) return jsonOk({ error: "Write a message before sending." }, 422);
    if (content.length > 3000) return jsonOk({ error: "Community messages must stay under 3000 characters." }, 422);
    const parentId = body?.parentId ? String(body.parentId) : "";
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
      return jsonOk({ error: "Reply target is invalid." }, 422);
    }

    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("_id slug title instructorId instructorName").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const parentMessage = parentId
      ? await CourseCommunityMessage.findOne({ _id: parentId, courseId: course._id, $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] })
          .select("_id")
          .lean()
      : null;
    if (parentId && !parentMessage) return jsonOk({ error: "Reply target was not found." }, 404);

    const learnerEmail = String(session.user.email ?? "").toLowerCase();
    const isInstructor =
      String(course.instructorId ?? "") === String(session.user.id ?? "") ||
      String(course.instructorName ?? "").toLowerCase() === String(session.user.name ?? "").toLowerCase() ||
      ["admin", "instructor"].includes(String(session.user.role ?? ""));

    const message = await CourseCommunityMessage.create({
      courseId: course._id,
      courseSlug: course.slug,
      parentId: parentMessage?._id,
      senderId: session.user.id,
      senderName: session.user.name ?? learnerEmail,
      senderEmail: learnerEmail,
      senderRole: session.user.role,
      content,
      isInstructor,
      isPinned: Boolean(body?.isPinned && isInstructor && !parentMessage)
    });
    await Course.updateOne(
      { _id: course._id },
      {
        $inc: {
          commentCount: 1,
          ...(parentMessage ? { replyCount: 1 } : {})
        }
      }
    );
    revalidatePublicContent("course", course.slug);

    return jsonOk(serializeMessage(message.toObject(), String(session.user.id ?? "")), 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    if (!session?.user) return jsonOk({ error: "Authentication required." }, 401);

    const { courseId } = await params;
    const body = await readJson(request);
    const action = String(body?.action ?? "");
    const messageId = String(body?.messageId ?? "");

    if (action !== "toggle_like") return jsonOk({ error: "Unsupported community action." }, 422);
    if (!mongoose.Types.ObjectId.isValid(messageId)) return jsonOk({ error: "Message is invalid." }, 422);

    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("_id").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const message = await CourseCommunityMessage.findOne({
      _id: messageId,
      ...activeMessageFilter(course._id)
    }).select("courseId likedBy likeCount");
    if (!message) return jsonOk({ error: "Message not found." }, 404);

    const userId = userObjectId(session.user.id);
    if (!userId) return jsonOk({ error: "Authentication required." }, 401);
    await ensureLegacyMessageLikes(message.toObject());
    const existing = await CourseCommunityLike.findOne({ messageId: message._id, userId }).select("_id").lean();

    if (existing) {
      await CourseCommunityLike.deleteOne({ _id: existing._id });
    } else {
      await CourseCommunityLike.create({
        courseId: course._id,
        messageId: message._id,
        userId,
        userEmail: String(session.user.email ?? "").toLowerCase()
      });
    }
    message.likeCount = await CourseCommunityLike.countDocuments({ messageId: message._id });
    await message.save();

    return jsonOk({
      id: String(message._id),
      liked: !existing,
      likes: message.likeCount
    });
  } catch (error) {
    return jsonError(error);
  }
}
