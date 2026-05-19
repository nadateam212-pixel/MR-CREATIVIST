import { auth } from "@/auth";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import WorkspaceRecord from "@/models/WorkspaceRecord";
import { buildCourseStructure } from "@/lib/learning-engine";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";

const PASSING_SCORE = 75;

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

function fallbackQuestions(course: {
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

function buildQuestions(course: Record<string, unknown>, lessonKey?: string): QuizQuestion[] {
  const structure = buildCourseStructure(course);
  const lesson = lessonKey ? structure.flatLessons.find((item: { key: string }) => item.key === lessonKey) : null;

  if (lesson?.quizQuestions?.length) {
    return lesson.quizQuestions.map((question: { id?: string; question: string; options: string[]; correctIndex: number; explanation?: string }, index: number) => ({
      id: question.id || `q-${index + 1}`,
      question: question.question,
      options: question.options,
      correctIndex: Math.min(question.options.length - 1, Math.max(0, Number(question.correctIndex ?? 0))),
      explanation: question.explanation ?? ""
    }));
  }

  const moduleTitle = lesson?.moduleTitle;
  const moduleSeed = moduleTitle ? [{ title: moduleTitle }] : (course.modules as { title: string }[] | undefined);

  return fallbackQuestions({
    title: String(course.title ?? "Course"),
    outcomes: course.outcomes as string[] | undefined,
    modules: moduleSeed
  });
}

function normalizeAnswers(input: unknown, questions: { id: string }[]) {
  if (Array.isArray(input)) {
    return questions.map((_, index) => Number(input[index]));
  }

  if (typeof input === "object" && input !== null) {
    const record = input as Record<string, unknown>;
    return questions.map((question) => Number(record[question.id]));
  }

  return questions.map(() => Number.NaN);
}

export async function GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const { courseId } = await params;
    const lessonKey = new URL(request.url).searchParams.get("lessonKey") ?? undefined;
    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("title slug outcomes modules").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    return jsonOk({ courseTitle: course.title, passingScore: PASSING_SCORE, questions: buildQuestions(course, lessonKey) });
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
    const course = await Course.findOne(mongoIdOrSlug(courseId)).select("_id title slug outcomes modules").lean();
    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const questions = buildQuestions(course, typeof body.lessonKey === "string" ? body.lessonKey : undefined);
    const answers = normalizeAnswers(body.answers, questions);
    const correct = questions.reduce(
      (total: number, question: QuizQuestion, index: number) =>
        total + (Number(answers[index]) === question.correctIndex ? 1 : 0),
      0
    );
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const existingEnrollment = await Enrollment.findOne({ courseId: course._id, learnerEmail: session.user.email }).lean();
    const nextProgress = Math.max(Number(existingEnrollment?.progressPercent ?? 0), score >= PASSING_SCORE ? Number(existingEnrollment?.progressPercent ?? 0) : Math.round(score / 2));
    const passed = score >= PASSING_SCORE;

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
        status: passed ? "approved" : "needs_review",
        metadata: { score, correct, total: questions.length }
      })
    ]);

    return jsonOk(
      {
        score,
        correct,
        total: questions.length,
        passingScore: PASSING_SCORE,
        passed,
        corrections: questions.map((question: QuizQuestion, index: number) => ({
          id: question.id,
          selectedIndex: Number.isFinite(answers[index]) ? answers[index] : null,
          correctIndex: question.correctIndex,
          correctAnswer: question.options[question.correctIndex],
          explanation: question.explanation ?? ""
        }))
      },
      201
    );
  } catch (error) {
    return jsonError(error);
  }
}
