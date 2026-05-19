import { auth } from "@/auth";
import Course from "@/models/Course";
import CourseCommunityMessage from "@/models/CourseCommunityMessage";
import Enrollment from "@/models/Enrollment";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";

function serializeMessage(message: Record<string, unknown>) {
  return {
    id: String(message._id ?? message.id),
    courseId: String(message.courseId),
    courseSlug: message.courseSlug,
    senderId: String(message.senderId),
    senderName: message.senderName,
    senderEmail: message.senderEmail,
    senderRole: message.senderRole,
    content: message.content,
    isInstructor: Boolean(message.isInstructor),
    isPinned: Boolean(message.isPinned),
    createdAt: message.createdAt
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    if (!session?.user) return jsonOk({ error: "Authentication required." }, 401);

    const { courseId } = await params;
    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("_id slug title instructorId instructorName").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const messages = await CourseCommunityMessage.find({ courseId: course._id, deletedAt: { $exists: false } })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(80)
      .lean();
    const isInstructor =
      String(course.instructorId ?? "") === String(session.user.id ?? "") ||
      String(course.instructorName ?? "").toLowerCase() === String(session.user.name ?? "").toLowerCase() ||
      ["admin", "instructor"].includes(String(session.user.role ?? ""));

    return jsonOk({
      course: { id: String(course._id), slug: course.slug, title: course.title },
      isInstructor,
      items: messages.reverse().map(serializeMessage)
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

    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("_id slug title instructorId instructorName").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const learnerEmail = String(session.user.email ?? "").toLowerCase();
    const [enrollment] = await Promise.all([
      Enrollment.findOne({ courseId: course._id, learnerEmail }).select("_id").lean()
    ]);
    const isInstructor =
      String(course.instructorId ?? "") === String(session.user.id ?? "") ||
      String(course.instructorName ?? "").toLowerCase() === String(session.user.name ?? "").toLowerCase() ||
      ["admin", "instructor"].includes(String(session.user.role ?? ""));

    if (!enrollment && !isInstructor) {
      return jsonOk({ error: "Join this course before posting in its community." }, 403);
    }

    const message = await CourseCommunityMessage.create({
      courseId: course._id,
      courseSlug: course.slug,
      senderId: session.user.id,
      senderName: session.user.name ?? learnerEmail,
      senderEmail: learnerEmail,
      senderRole: session.user.role,
      content,
      isInstructor,
      isPinned: Boolean(body?.isPinned && isInstructor)
    });

    return jsonOk(serializeMessage(message.toObject()), 201);
  } catch (error) {
    return jsonError(error);
  }
}
