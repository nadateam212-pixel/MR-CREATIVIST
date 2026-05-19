import { auth } from "@/auth";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import WorkspaceRecord from "@/models/WorkspaceRecord";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";

function buildQuestions(course: {
  title: string;
  outcomes?: string[];
  modules?: { title: string }[];
}) {
  const seeds = [
    ...(course.outcomes ?? []),
    ...((course.modules ?? []).map((module) => module.title))
  ].slice(0, 6);
  const source = seeds.length ? seeds : ["core concept", "practical workflow", "final outcome"];

  return source.map((seed, index) => ({
    id: `q-${index + 1}`,
    question: `Which action best proves "${seed}" in ${course.title}?`,
    options: [
      `Apply ${seed.toLowerCase()} in a practical project`,
      "Skip the lesson and request a certificate",
      "Memorize the title only",
      "Disable progress tracking"
    ],
    correctIndex: 0
  }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const { courseId } = await params;
    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("title outcomes modules").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    return jsonOk({ courseTitle: course.title, questions: buildQuestions(course) });
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
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("_id title slug outcomes modules").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const questions = buildQuestions(course);
    const correct = questions.reduce((total, question, index) => total + (Number(answers[index]) === question.correctIndex ? 1 : 0), 0);
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const existingEnrollment = await Enrollment.findOne({ courseId: course._id, learnerEmail: session.user.email }).lean();
    const nextProgress = Math.max(Number(existingEnrollment?.progressPercent ?? 0), score >= 80 ? 60 : Math.round(score / 2));

    await Promise.all([
      Enrollment.findOneAndUpdate(
        { courseId: course._id, learnerEmail: session.user.email },
        {
          courseId: course._id,
          userId: session.user.id,
          learnerName: session.user.name ?? "Learner",
          learnerEmail: session.user.email,
          progressPercent: nextProgress,
          status: nextProgress >= 100 ? "completed" : "active"
        },
        { returnDocument: "after", upsert: true, runValidators: true }
      ),
      WorkspaceRecord.create({
        userId: session.user.id,
        userEmail: session.user.email,
        role: session.user.role,
        pathname: `/dashboard/learning/${course.slug}/quiz`,
        module: "quiz",
        title: `${course.title} quiz attempt`,
        description: `Quiz score ${score}%`,
        kind: "quiz_attempt",
        status: score >= 80 ? "approved" : "needs_review",
        metadata: { score, correct, total: questions.length }
      })
    ]);

    return jsonOk({ score, correct, total: questions.length, passed: score >= 80 }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
