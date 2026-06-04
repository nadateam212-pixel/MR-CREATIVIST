import { z } from "zod";
import { auth } from "@/auth";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import LearningProgress from "@/models/LearningProgress";
import User from "@/models/User";
import {
  buildCourseStructure,
  calculateProgressPercent,
  nextLessonKey,
  publicLearningProgress
} from "@/lib/learning-engine";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";

const progressSchema = z.object({
  learnerEmail: z.email().optional(),
  lessonKey: z.string().trim().max(80).optional(),
  currentLessonKey: z.string().trim().max(80).optional(),
  action: z
    .enum([
      "viewed",
      "played",
      "studied",
      "read",
      "watched",
      "completed",
      "quiz_passed",
      "quiz_failed",
      "assignment_submitted",
      "downloaded"
    ])
    .default("completed"),
  seconds: z.coerce.number().min(0).max(86400).optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  progressPercent: z.coerce.number().min(0).max(100).optional()
});

const completionActions = new Set(["read", "watched", "completed", "quiz_passed", "assignment_submitted", "downloaded"]);

function studySecondsByLesson(events: { lessonKey?: string; seconds?: number }[] = []) {
  const totals = new Map<string, number>();

  for (const event of events) {
    const lessonKey = String(event.lessonKey ?? "");
    const seconds = Math.max(0, Number(event.seconds ?? 0));

    if (!lessonKey || !seconds) continue;
    totals.set(lessonKey, (totals.get(lessonKey) ?? 0) + seconds);
  }

  return Object.fromEntries(totals.entries());
}

function previousModulesReady(
  structure: ReturnType<typeof buildCourseStructure>,
  moduleIndex: number,
  completedLessonKeys: string[]
) {
  const completed = new Set(completedLessonKeys);

  return structure.modules
    .slice(0, moduleIndex)
    .every((module: { key: string; lessons: { key: string; durationMinutes: number }[] }) =>
      module.lessons.every((lesson) => completed.has(lesson.key))
    );
}

export async function GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    const { courseId } = await params;
    const course = await Course.findOne(mongoIdOrSlug(courseId)).lean();

    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const { searchParams } = new URL(request.url);
    const learnerEmail = (searchParams.get("learnerEmail") ?? session?.user?.email ?? "").toLowerCase();

    if (searchParams.get("mine") === "1") {
      if (!learnerEmail) return jsonOk({ error: "Authentication required." }, 401);

      const [progress, enrollment] = await Promise.all([
        LearningProgress.findOne({ courseId: course._id, learnerEmail }).lean(),
        Enrollment.findOne({ courseId: course._id, learnerEmail }).lean()
      ]);
      const structure = buildCourseStructure(course);

      return jsonOk({
        course: structure,
        progress: publicLearningProgress(progress, enrollment, structure)
      });
    }

    const items = await Enrollment.find({ courseId: course._id }).sort({ updatedAt: -1 }).limit(50).lean();
    const learningRecords = await LearningProgress.find({ courseId: course._id })
      .select("learnerName learnerEmail progressPercent currentLessonKey completedLessonKeys lastActivityAt status")
      .sort({ lastActivityAt: -1 })
      .limit(50)
      .lean();

    return jsonOk({ items, learningRecords });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await auth();
    const { courseId } = await params;
    const body = progressSchema.parse(await readJson(request));
    const learnerEmail = body.learnerEmail ?? session?.user?.email;

    if (!learnerEmail) return jsonOk({ error: "Sign in or provide learner email." }, 401);

    const course = await Course.findOne(mongoIdOrSlug(courseId)).lean();

    if (!course) return jsonOk({ error: "Course not found." }, 404);

    const structure = buildCourseStructure(course);
    const lesson = body.lessonKey ? structure.flatLessons.find((item: { key: string }) => item.key === body.lessonKey) : null;

    if (body.lessonKey && !lesson) return jsonOk({ error: "Lesson not found in this course." }, 404);

    const account = session?.user?.id
      ? await User.findById(session.user.id).select("_id name email").lean()
      : await User.findOne({ email: learnerEmail.toLowerCase() }).select("_id name email").lean();
    const normalizedEmail = learnerEmail.toLowerCase();
    const [existingProgress, existingEnrollment] = await Promise.all([
      LearningProgress.findOne({ courseId: course._id, learnerEmail: normalizedEmail }).lean(),
      Enrollment.findOne({ courseId: course._id, learnerEmail: normalizedEmail }).lean()
    ]);
    const isCourseManager =
      ["admin", "instructor"].includes(String(session?.user?.role ?? "").toLowerCase()) ||
      (course.instructorId && session?.user?.id && String(course.instructorId) === String(session.user.id));

    if (!existingEnrollment && !isCourseManager) {
      return jsonOk({ error: "Enroll in this course before opening the full learning workspace." }, 403);
    }
    const completedLessonKeys = new Set(existingProgress?.completedLessonKeys ?? []);

    if (lesson && !previousModulesReady(structure, lesson.moduleIndex, Array.from(completedLessonKeys).map(String))) {
      return jsonOk(
        {
          error: "Finish the previous chapter lessons before unlocking this chapter."
        },
        403
      );
    }

    if (lesson?.type === "quiz" && completionActions.has(body.action) && body.action !== "quiz_passed") {
      return jsonOk({ error: "Submit and pass the quiz before this lesson can be completed." }, 422);
    }

    if (body.action === "quiz_passed" && Number(body.score ?? 0) < 75) {
      return jsonOk({ error: "Quiz score must be at least 75% before the next chapter can unlock." }, 422);
    }

    if (lesson && completionActions.has(body.action)) {
      completedLessonKeys.add(lesson.key);
    }

    if (body.progressPercent === 100 && !lesson) {
      structure.flatLessons.forEach((item: { key: string }) => completedLessonKeys.add(item.key));
    }

    const completedKeys = Array.from(completedLessonKeys);
    const calculatedPercent = calculateProgressPercent(structure, completedKeys);
    const progressPercent =
      typeof body.progressPercent === "number" ? Math.max(calculatedPercent, body.progressPercent) : calculatedPercent;
    const nextKey = body.currentLessonKey ?? nextLessonKey(structure, completedKeys) ?? lesson?.key;
    const now = new Date();
    const learnerName = account?.name ?? session?.user?.name ?? "Learner";

    const progress = await LearningProgress.findOneAndUpdate(
      { courseId: course._id, learnerEmail: normalizedEmail },
      {
        $set: {
          courseId: course._id,
          userId: account?._id,
          learnerName,
          learnerEmail: normalizedEmail,
          completedLessonKeys: completedKeys,
          currentLessonKey: nextKey,
          progressPercent,
          status: progressPercent >= 100 ? "completed" : "active",
          lastActivityAt: now
        },
        ...(lesson
          ? {
              $push: {
                events: {
                  $each: [
                    {
                      lessonKey: lesson.key,
                      lessonTitle: lesson.title,
                      moduleTitle: lesson.moduleTitle,
                      action: body.action,
                      seconds: body.seconds ?? 0,
                      score: body.score,
                      createdAt: now
                    }
                  ],
                  $slice: -80
                }
              }
            }
          : {})
      },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    const enrollment = await Enrollment.findOneAndUpdate(
      { courseId: course._id, learnerEmail: normalizedEmail },
      {
        courseId: course._id,
        userId: account?._id,
        learnerName,
        learnerEmail: normalizedEmail,
        progressPercent,
        status: progressPercent >= 100 ? "completed" : "active"
      },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    if (account) {
      await User.findByIdAndUpdate(account._id, { $addToSet: { validatedRoles: { $each: ["client", "student"] } } });
    }

    return jsonOk({
      enrollment,
      progress: publicLearningProgress(progress, enrollment, structure)
    });
  } catch (error) {
    return jsonError(error);
  }
}
