import { auth } from "@/auth";
import { saveCourseEnrollment } from "@/lib/enrollment-service";
import { jsonError, jsonOk, readJson, requireMongo } from "@/lib/mongo-api";
import { enrollmentSchema } from "@/lib/mongo-validations";

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    const { courseId } = await params;
    const rawBody = await readJson(request);
    const body = enrollmentSchema
      .omit({ courseId: true })
      .parse({
        learnerName: session?.user?.name ?? rawBody.learnerName,
        learnerEmail: session?.user?.email ?? rawBody.learnerEmail,
        ...rawBody
      });
    const result = await saveCourseEnrollment({
      courseId,
      enrollment: body,
      session
    });

    if (!result.course) return jsonOk({ error: "Course not found." }, 404);

    return jsonOk(
      {
        enrollment: result.enrollment,
        created: result.created,
        message: result.created ? "Enrollment saved." : "Enrollment already active."
      },
      result.created ? 201 : 200
    );
  } catch (error) {
    return jsonError(error);
  }
}
