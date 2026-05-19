import { auth } from "@/auth";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import LearningProgress from "@/models/LearningProgress";
import { buildCourseStructure, moduleCompletionReady, publicLearningProgress } from "@/lib/learning-engine";
import { issueCertificateCredential } from "@/lib/platform-ledger";
import { jsonError, jsonOk, mongoIdOrSlug, requireMongo } from "@/lib/mongo-api";

export async function POST(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    if (!session?.user) return jsonOk({ error: "Authentication required." }, 401);

    const { courseId } = await params;
    const course = await Course.findOne(mongoIdOrSlug(courseId)).lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const learnerEmail = session.user.email?.toLowerCase();
    if (!learnerEmail) return jsonOk({ error: "Account email is required." }, 401);

    const [progress, enrollment] = await Promise.all([
      LearningProgress.findOne({ courseId: course._id, learnerEmail }).lean(),
      Enrollment.findOne({ courseId: course._id, learnerEmail }).lean()
    ]);
    const structure = buildCourseStructure(course);
    const snapshot = publicLearningProgress(progress, enrollment, structure);
    const timeReady = structure.modules.every((module: { key: string; lessons: { key: string; durationMinutes: number }[] }) =>
      moduleCompletionReady(structure, module, snapshot.completedLessonKeys, snapshot.studySecondsByLesson).ready
    );

    if (snapshot.progressPercent < 100 || !timeReady) {
      return jsonOk(
        {
          error: timeReady
            ? "Complete every lesson, reading, video, quiz, and assignment before generating this certificate."
            : "Complete every chapter's required learning time before generating this certificate.",
          progressPercent: snapshot.progressPercent
        },
        403
      );
    }

    const certificate = await issueCertificateCredential(session.user, {
      courseSlug: course.slug,
      courseTitle: course.title,
      template: "Professional"
    });

    await LearningProgress.findOneAndUpdate(
      { courseId: course._id, learnerEmail },
      { certificateIssuedAt: new Date(), status: "completed", progressPercent: 100 },
      { returnDocument: "after" }
    );

    return jsonOk({ certificate, message: "Course certificate issued." }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
