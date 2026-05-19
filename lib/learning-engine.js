import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import LearningProgress from "@/models/LearningProgress";
import { normalizeCourseImage } from "@/lib/course-media";
import { connectMongoDB, friendlyMongoError, isMongoConnectionError } from "@/lib/mongodb";
import { mongoIdOrSlug } from "@/lib/mongo-api";

function cleanJson(doc) {
  const value = typeof doc?.toObject === "function" ? doc.toObject({ virtuals: true }) : doc;

  return JSON.parse(JSON.stringify(value));
}

function fallbackLessonType(index) {
  return ["video", "article", "assignment", "quiz"][index % 4];
}

function normalizeResources(resources) {
  return Array.isArray(resources)
    ? resources
        .filter((resource) => resource?.label || resource?.url)
        .map((resource, index) => ({
          label: resource.label ?? `Resource ${index + 1}`,
          url: resource.url ?? "#"
        }))
    : [];
}

function toIsoString(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function publicLearningEvents(events = []) {
  return events
    .slice(-20)
    .reverse()
    .map((event) => ({
      lessonKey: event?.lessonKey ? String(event.lessonKey) : undefined,
      lessonTitle: event?.lessonTitle ? String(event.lessonTitle) : undefined,
      moduleTitle: event?.moduleTitle ? String(event.moduleTitle) : undefined,
      action: event?.action ? String(event.action) : "viewed",
      seconds: typeof event?.seconds === "number" ? event.seconds : 0,
      score: typeof event?.score === "number" ? event.score : undefined,
      createdAt: toIsoString(event?.createdAt) ?? undefined
    }));
}

function publicQuizAttempts(events = []) {
  const attempts = {};

  for (const event of events) {
    const lessonKey = event?.lessonKey ? String(event.lessonKey) : "";
    if (!lessonKey || !["quiz_passed", "quiz_failed"].includes(String(event?.action ?? ""))) continue;

    attempts[lessonKey] = {
      score: typeof event?.score === "number" ? event.score : 0,
      passed: event.action === "quiz_passed",
      at: toIsoString(event.createdAt) ?? undefined
    };
  }

  return attempts;
}

function studySecondsByLesson(events = []) {
  const totals = {};

  for (const event of events) {
    const lessonKey = event?.lessonKey ? String(event.lessonKey) : "";
    const seconds = Math.max(0, Number(event?.seconds ?? 0));

    if (!lessonKey || !seconds) continue;
    totals[lessonKey] = Math.min(7 * 24 * 60 * 60, (totals[lessonKey] ?? 0) + seconds);
  }

  return totals;
}

export function requiredModuleSeconds(courseModule) {
  const minutes = (courseModule?.lessons ?? []).reduce((total, lesson) => total + Number(lesson.durationMinutes ?? 0), 0);

  return Math.max(0, Math.round(minutes * 60));
}

export function moduleStudySeconds(course, moduleKey, lessonSeconds = {}) {
  const courseModule = course.modules?.find((item) => item.key === moduleKey);

  if (!courseModule) return 0;

  return courseModule.lessons.reduce((total, lesson) => total + Number(lessonSeconds[lesson.key] ?? 0), 0);
}

export function moduleCompletionReady(course, courseModule, completedLessonKeys = [], lessonSeconds = {}) {
  const completed = new Set(completedLessonKeys);
  const lessonsComplete =
    Boolean(courseModule?.lessons?.length) && courseModule.lessons.every((lesson) => completed.has(lesson.key));
  const requiredSeconds = requiredModuleSeconds(courseModule);
  const studiedSeconds = moduleStudySeconds(course, courseModule.key, lessonSeconds);

  return {
    lessonsComplete,
    requiredSeconds,
    studiedSeconds,
    timeComplete: studiedSeconds >= requiredSeconds,
    ready: lessonsComplete && studiedSeconds >= requiredSeconds
  };
}

function normalizeLesson(rawLesson, moduleIndex, lessonIndex, moduleTitle, course) {
  const type = rawLesson?.type ?? fallbackLessonType(lessonIndex);
  const title =
    rawLesson?.title ??
    [
      `Watch: ${moduleTitle}`,
      `Read: ${moduleTitle} playbook`,
      `Practice lab: ${moduleTitle}`,
      `Checkpoint quiz: ${moduleTitle}`
    ][lessonIndex % 4];

  return {
    key: `m${moduleIndex + 1}-l${lessonIndex + 1}`,
    title,
    type,
    durationMinutes: Number(rawLesson?.durationMinutes ?? (type === "quiz" ? 15 : 25 + lessonIndex * 5)),
    videoUrl: rawLesson?.videoUrl ?? (type === "video" && moduleIndex === 0 && lessonIndex === 0 ? course.trailerUrl || "" : ""),
    imageUrl: rawLesson?.imageUrl ?? "",
    quizQuestions: Array.isArray(rawLesson?.quizQuestions)
      ? rawLesson.quizQuestions
          .filter((question) => question?.question && Array.isArray(question?.options) && question.options.length >= 2)
          .map((question, index) => ({
            id: question.id || `${moduleIndex + 1}-${lessonIndex + 1}-${index + 1}`,
            question: question.question,
            options: question.options,
            correctIndex: Number(question.correctIndex ?? 0),
            explanation: question.explanation ?? ""
          }))
      : [],
    resources: normalizeResources(rawLesson?.resources),
    isPreview: Boolean(rawLesson?.isPreview),
    summary:
      rawLesson?.summary ??
      `Complete this ${type} lesson to unlock the next step in ${course.title}. Your activity is saved to your learning record.`
  };
}

function buildFallbackModules(course) {
  const sourceTitles = [
    ...(Array.isArray(course.modules) ? course.modules.map((module) => module?.title).filter(Boolean) : []),
    ...(Array.isArray(course.chapters) ? course.chapters.filter(Boolean) : []),
    ...(Array.isArray(course.outcomes) ? course.outcomes.slice(0, 3).filter(Boolean) : [])
  ];
  const titles = sourceTitles.length
    ? sourceTitles.slice(0, 6)
    : ["Orientation and goals", "Core skills", "Guided practice", "Final assessment"];

  return titles.map((title, moduleIndex) => ({
    title,
    description: `Instructor-planned chapter covering ${String(title).toLowerCase()}, guided practice, and a completion checkpoint.`,
    lessons: Array.from({ length: moduleIndex === titles.length - 1 ? 4 : 3 }, (_, lessonIndex) =>
      normalizeLesson(null, moduleIndex, lessonIndex, title, course)
    )
  }));
}

export function buildCourseStructure(rawCourse) {
  const course = cleanJson(rawCourse);
  const sourceModules = Array.isArray(course.modules) ? course.modules : [];
  const hasRealLessons = sourceModules.some((module) => Array.isArray(module?.lessons) && module.lessons.length > 0);
  const modules = (hasRealLessons ? sourceModules : buildFallbackModules(course)).map((module, moduleIndex) => {
    const title = module.title ?? `Chapter ${moduleIndex + 1}`;
    const sourceLessons = Array.isArray(module.lessons) && module.lessons.length > 0 ? module.lessons : Array.from({ length: 3 });
    const lessons = sourceLessons.map((lesson, lessonIndex) => normalizeLesson(lesson, moduleIndex, lessonIndex, title, course));

    return {
      key: `m${moduleIndex + 1}`,
      title,
      description: module.description ?? `Learn ${String(title).toLowerCase()} with videos, readings, practice, and checks.`,
      lessons
    };
  });
  const flatLessons = modules.flatMap((module, moduleIndex) =>
    module.lessons.map((lesson, lessonIndex) => ({
      moduleKey: module.key,
      moduleTitle: module.title,
      moduleIndex,
      lessonIndex,
      ...lesson
    }))
  );
  const totalMinutes = flatLessons.reduce((total, lesson) => total + Number(lesson.durationMinutes ?? 0), 0);

  return {
    id: String(course._id ?? course.id ?? course.slug),
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription ?? course.description,
    description: course.description ?? course.shortDescription ?? "",
    instructor: course.instructorName ?? course.instructor ?? "MR Creativist",
    level: course.level ?? "Beginner",
    category: course.category ?? "Course",
    certificate: course.certificate ?? "Completion certificate",
    image: normalizeCourseImage(course.image, course.category),
    outcomes: Array.isArray(course.outcomes) ? course.outcomes : [],
    tools: Array.isArray(course.tools) ? course.tools : [],
    modules,
    flatLessons,
    totalLessons: flatLessons.length,
    totalMinutes
  };
}

export function calculateProgressPercent(course, completedLessonKeys = []) {
  const total = course.flatLessons?.length ?? 0;
  if (!total) return 0;

  const completed = new Set(completedLessonKeys);
  const validCompleted = course.flatLessons.filter((lesson) => completed.has(lesson.key)).length;

  return Math.min(100, Math.round((validCompleted / total) * 100));
}

export function nextLessonKey(course, completedLessonKeys = []) {
  const completed = new Set(completedLessonKeys);
  const nextLesson = course.flatLessons?.find((lesson) => !completed.has(lesson.key));

  return nextLesson?.key ?? course.flatLessons?.at(-1)?.key ?? "";
}

export function publicLearningProgress(progress, enrollment, course) {
  const completedLessonKeys = Array.from(new Set(progress?.completedLessonKeys ?? [])).map(String).filter(Boolean);
  const lessonSeconds = studySecondsByLesson(progress?.events ?? []);
  const moduleSeconds = Object.fromEntries(
    (course.modules ?? []).map((module) => [module.key, moduleStudySeconds(course, module.key, lessonSeconds)])
  );
  const moduleRequirements = Object.fromEntries(
    (course.modules ?? []).map((module) => [module.key, requiredModuleSeconds(module)])
  );
  const calculatedPercent = calculateProgressPercent(course, completedLessonKeys);
  const progressPercent = Math.max(calculatedPercent, Number(progress?.progressPercent ?? enrollment?.progressPercent ?? 0));
  const currentLessonKey = progress?.currentLessonKey ?? nextLessonKey(course, completedLessonKeys);

  return {
    completedLessonKeys,
    currentLessonKey,
    progressPercent: Math.min(100, progressPercent),
    status: progress?.status ?? enrollment?.status ?? (progressPercent >= 100 ? "completed" : "active"),
    certificateIssuedAt: toIsoString(progress?.certificateIssuedAt ?? enrollment?.certificateIssuedAt),
    lastActivityAt: toIsoString(progress?.lastActivityAt ?? progress?.updatedAt ?? enrollment?.updatedAt),
    studySecondsByLesson: lessonSeconds,
    studySecondsByModule: moduleSeconds,
    moduleRequiredSeconds: moduleRequirements,
    totalStudySeconds: Object.values(lessonSeconds).reduce((total, seconds) => total + Number(seconds ?? 0), 0),
    quizAttempts: publicQuizAttempts(progress?.events ?? []),
    events: publicLearningEvents(progress?.events ?? [])
  };
}

export async function getCourseLearningSnapshot(courseId, user) {
  try {
    await connectMongoDB();
    const courseDoc = await Course.findOne(mongoIdOrSlug(courseId)).lean();
    if (!courseDoc) return null;

    const course = buildCourseStructure(courseDoc);
    const learnerEmail = user?.email?.toLowerCase();
    let progress = null;
    let enrollment = null;

    if (learnerEmail) {
      [progress, enrollment] = await Promise.all([
        LearningProgress.findOne({ courseId: courseDoc._id, learnerEmail }).lean(),
        Enrollment.findOne({ courseId: courseDoc._id, learnerEmail }).lean()
      ]);
    }

    return {
      course,
      progress: publicLearningProgress(progress, enrollment, course),
      databaseError: null
    };
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return {
        course: null,
        progress: null,
        databaseError: friendlyMongoError(error)
      };
    }

    throw error;
  }
}
