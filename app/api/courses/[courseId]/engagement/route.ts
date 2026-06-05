import { auth } from "@/auth";
import Course from "@/models/Course";
import CourseCommunityMessage from "@/models/CourseCommunityMessage";
import CourseLike from "@/models/CourseLike";
import mongoose from "mongoose";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";
import { revalidatePublicContent } from "@/lib/public-revalidation";

function userObjectId(value?: unknown) {
  const id = String(value ?? "");
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

function activeCommentFilter(courseId: unknown) {
  return {
    courseId,
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }]
  };
}

type EngagementCourse = {
  _id: unknown;
  likes?: number;
  likedBy?: unknown[];
  shareCount?: number;
  commentCount?: number;
  replyCount?: number;
};

async function engagementPayload(course: EngagementCourse, userId?: string) {
  await ensureLegacyCourseLikes(course);
  const userIdObject = userObjectId(userId);
  const [likes, likedRecord, comments, replies] = await Promise.all([
    CourseLike.countDocuments({ courseId: course._id }),
    userIdObject ? CourseLike.exists({ courseId: course._id, userId: userIdObject }) : null,
    CourseCommunityMessage.countDocuments({
      ...activeCommentFilter(course._id),
      $or: [
        { deletedAt: { $exists: false }, parentId: { $exists: false } },
        { deletedAt: null, parentId: null }
      ]
    }),
    CourseCommunityMessage.countDocuments({
      ...activeCommentFilter(course._id),
      parentId: { $exists: true, $ne: null }
    })
  ]);
  const commentCount = comments + replies;

  if (Number(course.commentCount ?? -1) !== commentCount || Number(course.replyCount ?? -1) !== replies || Number(course.likes ?? -1) !== likes) {
    await Course.updateOne(
      { _id: course._id },
      {
        $set: {
          commentCount,
          replyCount: replies,
          likes
        }
      }
    );
  }

  return {
    likes,
    liked: Boolean(likedRecord),
    shareCount: Number(course.shareCount ?? 0),
    comments,
    replies,
    commentCount
  };
}

async function ensureLegacyCourseLikes(course: EngagementCourse) {
  if (!Array.isArray(course.likedBy) || !course.likedBy.length) return;

  const operations = course.likedBy
    .map((item) => userObjectId(item))
    .filter(Boolean)
    .map((userId) => ({
      updateOne: {
        filter: { courseId: course._id, userId },
        update: {
          $setOnInsert: {
            courseId: course._id,
            courseSlug: String((course as { slug?: unknown }).slug ?? ""),
            userId
          }
        },
        upsert: true
      }
    }));

  if (operations.length) {
    await CourseLike.bulkWrite(operations, { ordered: false }).catch(() => undefined);
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    const { courseId } = await params;
    const course = await Course.findOne(mongoIdOrSlug(courseId))
      .select("_id likes likedBy shareCount commentCount replyCount")
      .lean();

    if (!course) return jsonOk({ error: "Course not found." }, 404);

    return jsonOk(await engagementPayload(course, session?.user?.id ? String(session.user.id) : undefined));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const { courseId } = await params;
    const body = await readJson(request);
    const action = String(body?.action ?? "");
    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("slug likes likedBy shareCount commentCount replyCount");

    if (!course) return jsonOk({ error: "Course not found." }, 404);

    if (action === "share") {
      course.shareCount = Number(course.shareCount ?? 0) + 1;
      await course.save();
      revalidatePublicContent("course", course.slug);
      return jsonOk(await engagementPayload(course.toObject()));
    }

    if (action !== "toggle_like") return jsonOk({ error: "Unsupported engagement action." }, 422);

    const session = await auth();
    if (!session?.user) return jsonOk({ error: "Authentication required." }, 401);

    const userId = userObjectId(session.user.id);
    if (!userId) return jsonOk({ error: "Authentication required." }, 401);
    await ensureLegacyCourseLikes(course.toObject());
    const existing = await CourseLike.findOne({ courseId: course._id, userId }).select("_id").lean();

    if (existing) {
      await CourseLike.deleteOne({ _id: existing._id });
    } else {
      await CourseLike.create({
        courseId: course._id,
        courseSlug: course.slug,
        userId,
        userEmail: String(session.user.email ?? "").toLowerCase()
      });
    }
    revalidatePublicContent("course", course.slug);

    return jsonOk(await engagementPayload(course.toObject(), String(userId)));
  } catch (error) {
    return jsonError(error);
  }
}
