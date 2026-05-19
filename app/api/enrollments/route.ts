import { auth } from "@/auth";
import Enrollment from "@/models/Enrollment";
import { saveCourseEnrollment } from "@/lib/enrollment-service";
import { enrollmentSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo } from "@/lib/mongo-api";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip } = parsePagination(request);
    const [items, total] = await Promise.all([
      Enrollment.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Enrollment.countDocuments({})
    ]);

    return jsonOk({ items, total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await auth();
    const rawBody = await readJson(request);
    const body = enrollmentSchema.parse({
      learnerName: session?.user?.name ?? rawBody.learnerName,
      learnerEmail: session?.user?.email ?? rawBody.learnerEmail,
      ...rawBody
    });
    const result = await saveCourseEnrollment({
      courseId: body.courseId,
      enrollment: body,
      session
    });

    if (!result.course) return jsonOk({ error: "Course not found." }, 404);

    return jsonOk(
      {
        item: result.enrollment,
        created: result.created,
        message: result.created ? "Enrollment saved." : "Enrollment already active."
      },
      result.created ? 201 : 200
    );
  } catch (error) {
    return jsonError(error);
  }
}
