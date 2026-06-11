import { normalizedExternalVideoUrl } from "@/lib/video-sources";

type StudioCourse = {
  title: string;
  slug: string;
  level: string;
  category: string;
  price: string;
  compareAt?: string;
  currency?: "USD" | "FRW" | string;
  duration: string;
  instructor: string;
  certificate: string;
  image: string;
  trailerUrl?: string;
  outcomes: string[];
  chapters: string[];
  tools: string[];
  status: string;
};

type StudioChapter = {
  id: string;
  title: string;
  description?: string;
  order?: number;
  estimatedMinutes?: number;
};

type StudioAsset = {
  id: string;
  chapterId?: string;
  lessonId?: string;
  type: "image" | "video" | "book" | "document";
  title: string;
  fileName?: string;
  url?: string;
  embedUrl?: string;
  playbackUrl?: string;
  durationSeconds?: number;
};

type StudioLesson = {
  id: string;
  chapterId: string;
  title: string;
  type: "video" | "article" | "image" | "download" | "assignment" | "quiz" | string;
  durationMinutes?: number;
  summary?: string;
  content?: string;
  videoUrl?: string;
  imageUrl?: string;
  assetIds?: string[];
  resources?: { label?: string; title?: string; url?: string }[];
  isPreview?: boolean;
  order?: number;
};

type StudioQuiz = {
  id: string;
  chapterId?: string;
  title: string;
  kind: "quiz" | "test";
  passingScore?: number;
  maxAttempts?: number;
  questions?: {
    id?: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }[];
};

type MongoLesson = {
  title: string;
  type: "video" | "article" | "image" | "quiz" | "assignment" | "download";
  sourceType: "google-drive" | "external-link" | "upload" | "text";
  durationMinutes: number;
  durationSeconds: number;
  summary?: string;
  videoUrl?: string;
  videoProvider?: string;
  imageUrl?: string;
  resources: {
    label: string;
    title: string;
    type: string;
    url: string;
    accessRule: "enrolled" | "free";
    downloadable: boolean;
  }[];
  quizQuestions: {
    id?: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }[];
  isPreview: boolean;
  freePreview: boolean;
  previewStartSeconds: number;
  previewEndSeconds: number;
};

type MongoModule = {
  title: string;
  description?: string;
  orderIndex: number;
  status: "draft" | "ready" | "hidden";
  lessons: MongoLesson[];
};

export type StudioCoursePayload = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  instructorName: string;
  level: string;
  category: string;
  language: "English";
  price: number;
  compareAtPrice?: number;
  currency: "USD" | "FRW";
  image: string;
  trailerUrl?: string;
  pricingType: "free" | "paid";
  duration: string;
  lessonsCount: number;
  certificate: string;
  outcomes: string[];
  tools: string[];
  tags: string[];
  modules: MongoModule[];
  resources: {
    title: string;
    type: string;
    url: string;
    accessRule: "enrolled" | "free";
    attachLevel: "course" | "lesson";
    downloadable: boolean;
    description?: string;
  }[];
  status: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85";

function cleanText(value: unknown, fallback = "") {
  return String(value ?? "").trim() || fallback;
}

function clampText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, Math.max(0, limit - 1)).trim()}...` : value;
}

function numberFromPrice(value?: string) {
  const raw = cleanText(value);
  if (!raw || /^free$/i.test(raw)) return 0;

  const numeric = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function currencyFromCourse(course: StudioCourse): "USD" | "FRW" {
  const explicit = String(course.currency ?? "").toUpperCase();
  if (explicit === "FRW") return "FRW";
  if (explicit === "USD") return "USD";

  const price = cleanText(course.price).toUpperCase();
  return price.startsWith("FRW") || price.includes(" FRW") ? "FRW" : "USD";
}

function validUrl(value?: string) {
  const clean = cleanText(value);
  if (!clean) return "";
  if (clean.startsWith("data:image/")) return clean;

  try {
    const url = new URL(clean);
    return ["http:", "https:"].includes(url.protocol) ? clean : "";
  } catch {
    return "";
  }
}

function lessonType(value?: string): MongoLesson["type"] {
  if (value === "video" || value === "article" || value === "image" || value === "quiz" || value === "assignment" || value === "download") {
    return value;
  }

  return "article";
}

function sourceTypeForVideo(value?: string): MongoLesson["sourceType"] {
  const clean = cleanText(value);
  if (!clean) return "text";

  const source = normalizedExternalVideoUrl(clean);
  if (source.provider === "google-drive") return "google-drive";
  if (source.provider === "direct") return "upload";
  if (source.provider === "empty") return "text";

  return "external-link";
}

export function studioAssetPrimaryUrl(asset?: StudioAsset) {
  return cleanText(asset?.embedUrl) || cleanText(asset?.playbackUrl) || cleanText(asset?.url);
}

function assetResource(asset: StudioAsset) {
  const url = validUrl(asset.url) || validUrl(studioAssetPrimaryUrl(asset));
  if (!url) return null;

  return {
    label: cleanText(asset.title, "Course resource"),
    title: cleanText(asset.title, "Course resource"),
    type: asset.type === "book" ? "PDF" : asset.type === "document" ? "Document" : asset.type === "image" ? "Image" : "Video",
    url,
    accessRule: "enrolled" as const,
    downloadable: asset.type !== "video"
  };
}

function uniqueResources(resources: NonNullable<ReturnType<typeof assetResource>>[]) {
  const seen = new Set<string>();

  return resources.filter((resource) => {
    if (seen.has(resource.url)) return false;
    seen.add(resource.url);
    return true;
  });
}

function lessonVideoUrl(lesson: StudioLesson, assets: StudioAsset[]) {
  const assetIds = new Set(lesson.assetIds ?? []);
  const videoAsset = assets.find((asset) => asset.type === "video" && (assetIds.has(asset.id) || asset.lessonId === lesson.id));
  const rawUrl = cleanText(lesson.videoUrl) || studioAssetPrimaryUrl(videoAsset);
  const normalized = normalizedExternalVideoUrl(rawUrl);

  return validUrl(normalized.playbackUrl) || validUrl(normalized.embedUrl) || validUrl(normalized.url) || validUrl(rawUrl);
}

function lessonResources(lesson: StudioLesson, assets: StudioAsset[]) {
  const assetIds = new Set(lesson.assetIds ?? []);
  const explicitResources = (lesson.resources ?? [])
    .map((resource) => {
      const url = validUrl(resource.url);
      if (!url) return null;

      const title = cleanText(resource.title ?? resource.label, "Lesson resource");
      return {
        label: title,
        title,
        type: "File",
        url,
        accessRule: "enrolled" as const,
        downloadable: true
      };
    })
    .filter(Boolean) as NonNullable<ReturnType<typeof assetResource>>[];
  const attachedResources = assets
    .filter((asset) => asset.type !== "video" && (assetIds.has(asset.id) || asset.lessonId === lesson.id))
    .map(assetResource)
    .filter(Boolean) as NonNullable<ReturnType<typeof assetResource>>[];

  return uniqueResources([...explicitResources, ...attachedResources]);
}

function toMongoLesson(lesson: StudioLesson, lessonIndex: number, assets: StudioAsset[], quiz?: StudioQuiz): MongoLesson {
  const type = lessonType(lesson.type);
  const videoUrl = type === "video" ? lessonVideoUrl(lesson, assets) : "";
  const normalized = normalizedExternalVideoUrl(videoUrl);
  const imageAsset = assets.find((asset) => asset.type === "image" && (lesson.assetIds ?? []).includes(asset.id));
  const durationMinutes = Math.max(0, Number(lesson.durationMinutes ?? (type === "quiz" ? 15 : 20)) || 0);

  return {
    title: clampText(cleanText(lesson.title, `Lesson ${lessonIndex + 1}`), 180),
    type,
    sourceType: type === "video" ? sourceTypeForVideo(videoUrl) : "text",
    durationMinutes,
    durationSeconds: Math.max(0, Math.round(durationMinutes * 60)),
    summary: clampText(cleanText(lesson.content) || cleanText(lesson.summary) || "Complete this lesson to continue the course.", 1200),
    videoUrl: videoUrl || undefined,
    videoProvider: videoUrl ? normalized.provider : undefined,
    imageUrl: type === "image" ? validUrl(lesson.imageUrl) || validUrl(imageAsset?.url) || undefined : undefined,
    resources: lessonResources(lesson, assets),
    quizQuestions: (quiz?.questions ?? [])
      .filter((question) => cleanText(question.question) && Array.isArray(question.options) && question.options.length >= 2)
      .map((question) => ({
        id: question.id,
        question: clampText(cleanText(question.question), 500),
        options: question.options.map((option) => clampText(cleanText(option, "Option"), 240)).slice(0, 6),
        correctIndex: Math.max(0, Number(question.correctIndex ?? 0) || 0),
        explanation: question.explanation ? clampText(question.explanation, 700) : undefined
      })),
    isPreview: Boolean(lesson.isPreview || lessonIndex === 0),
    freePreview: Boolean(lesson.isPreview || lessonIndex === 0),
    previewStartSeconds: 0,
    previewEndSeconds: 90
  };
}

function assetToLesson(asset: StudioAsset, lessonIndex: number): StudioLesson {
  const type = asset.type === "video" ? "video" : asset.type === "image" ? "image" : "download";
  const title = cleanText(asset.title, "Course asset");

  return {
    id: `asset-lesson-${asset.id}`,
    chapterId: asset.chapterId ?? "",
    title: type === "video" ? `Watch: ${title}` : type === "image" ? `View: ${title}` : `Download: ${title}`,
    type,
    durationMinutes: type === "video" ? Math.max(5, Math.round(Number(asset.durationSeconds ?? 1200) / 60)) : 10,
    summary: `${title} was uploaded by the instructor for this course.`,
    content: type === "video" ? "Watch this instructor video inside the course player." : "Use this instructor-provided resource to complete the lesson.",
    videoUrl: type === "video" ? studioAssetPrimaryUrl(asset) : "",
    imageUrl: type === "image" ? asset.url : "",
    assetIds: [asset.id],
    resources: type === "video" ? [] : [{ label: title, url: asset.url ?? "" }],
    isPreview: lessonIndex === 0,
    order: 1000 + lessonIndex
  };
}

function quizToLesson(quiz: StudioQuiz, chapterId: string, index: number): StudioLesson {
  return {
    id: `quiz-lesson-${quiz.id}`,
    chapterId,
    title: quiz.title || (quiz.kind === "test" ? "Final test" : "Chapter quiz"),
    type: "quiz",
    durationMinutes: Math.max(10, (quiz.questions?.length ?? 3) * 3),
    summary: `Pass this ${quiz.kind} with ${quiz.passingScore ?? 70}% or higher.`,
    content: `Answer ${quiz.questions?.length ?? 0} multiple-choice questions. You have ${quiz.maxAttempts ?? 3} attempts.`,
    assetIds: [],
    resources: [],
    isPreview: false,
    order: 2000 + index
  };
}

export function buildStudioModules({
  course,
  chapters,
  lessons,
  assets,
  quizzes
}: {
  course: StudioCourse;
  chapters: StudioChapter[];
  lessons: StudioLesson[];
  assets: StudioAsset[];
  quizzes: StudioQuiz[];
}) {
  const sourceChapters = chapters.length
    ? chapters
    : course.chapters.map((title, index) => ({
        id: `${course.slug}-${index + 1}`,
        title,
        description: `${title} lessons, resources, quiz checks, and completion tracking.`,
        order: index + 1
      }));
  const fallbackChapters = sourceChapters.length
    ? sourceChapters
    : [{ id: `${course.slug}-module-1`, title: "Getting Started", description: "Course lessons and resources.", order: 1 }];
  const lessonAssetIds = new Set(lessons.flatMap((lesson) => lesson.assetIds ?? []));
  const generatedAssetLessons = assets
    .filter((asset) => !lessonAssetIds.has(asset.id))
    .map((asset, index) => assetToLesson({ ...asset, chapterId: asset.chapterId || fallbackChapters[index % fallbackChapters.length]?.id }, index));
  const allLessons = [...lessons, ...generatedAssetLessons];

  return fallbackChapters
    .slice()
    .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0))
    .map((chapter, moduleIndex) => {
      const chapterLessons = allLessons
        .filter((lesson) => lesson.chapterId === chapter.id)
        .slice()
        .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));
      const chapterQuizLessons = quizzes
        .filter((quiz) => (quiz.chapterId ? quiz.chapterId === chapter.id : moduleIndex === fallbackChapters.length - 1))
        .filter((quiz) => !chapterLessons.some((lesson) => lesson.id === `quiz-lesson-${quiz.id}`))
        .map((quiz, quizIndex) => quizToLesson(quiz, chapter.id, quizIndex));
      const learningItems = [...chapterLessons, ...chapterQuizLessons];

      return {
        title: clampText(cleanText(chapter.title, `Module ${moduleIndex + 1}`), 180),
        description: clampText(cleanText(chapter.description, "Lessons, resources, and completion checks."), 900),
        orderIndex: moduleIndex,
        status: "ready" as const,
        lessons: learningItems.map((lesson, lessonIndex) => {
          const quiz = lesson.id.startsWith("quiz-lesson-")
            ? quizzes.find((item) => `quiz-lesson-${item.id}` === lesson.id)
            : quizzes.find((item) => item.chapterId === chapter.id && lesson.type === "quiz");

          return toMongoLesson(lesson, lessonIndex, assets, quiz);
        })
      };
    });
}

export function firstVideoUrlFromModules(modules: MongoModule[]) {
  return modules.flatMap((module) => module.lessons).find((lesson) => lesson.videoUrl)?.videoUrl ?? "";
}

export function countModuleLessons(modules: MongoModule[]) {
  return modules.reduce((total, module) => total + module.lessons.length, 0);
}

export function buildStudioCoursePayload({
  course,
  chapters,
  lessons,
  assets,
  quizzes,
  status
}: {
  course: StudioCourse;
  chapters: StudioChapter[];
  lessons: StudioLesson[];
  assets: StudioAsset[];
  quizzes: StudioQuiz[];
  status?: string;
}): StudioCoursePayload {
  const modules = buildStudioModules({ course, chapters, lessons, assets, quizzes });
  const price = numberFromPrice(course.price);
  const compareAtPrice = numberFromPrice(course.compareAt);
  const firstVideoUrl = firstVideoUrlFromModules(modules);
  const descriptionParts = [
    `${course.title} is a guided ${course.category} course from ${course.instructor}.`,
    ...course.outcomes,
    ...course.tools
  ].filter(Boolean);
  const description = clampText(descriptionParts.join(" "), 5000);
  const shortDescription = clampText(course.outcomes[0] || description || `${course.title} course with lessons, videos, resources, quizzes, and completion tracking.`, 260);
  const resources = uniqueResources(assets.filter((asset) => asset.type !== "video").map(assetResource).filter(Boolean) as NonNullable<ReturnType<typeof assetResource>>[])
    .map((resource) => ({
      title: resource.title,
      type: resource.type,
      url: resource.url,
      accessRule: resource.accessRule,
      attachLevel: "course" as const,
      downloadable: resource.downloadable,
      description: `${resource.title} for ${course.title}.`
    }));

  return {
    title: course.title,
    slug: course.slug,
    shortDescription: shortDescription.length >= 10 ? shortDescription : `${course.title} course materials.`,
    description: description.length >= 20 ? description : `${course.title} course with lessons, videos, resources, quizzes, and completion tracking.`,
    instructorName: course.instructor,
    level: course.level,
    category: course.category,
    language: "English",
    price,
    compareAtPrice: compareAtPrice > 0 ? compareAtPrice : undefined,
    currency: currencyFromCourse(course),
    image: validUrl(course.image) || fallbackImage,
    trailerUrl: validUrl(course.trailerUrl) || firstVideoUrl || undefined,
    pricingType: price > 0 ? "paid" : "free",
    duration: course.duration || "Self-paced",
    lessonsCount: countModuleLessons(modules),
    certificate: course.certificate || "Completion certificate",
    outcomes: course.outcomes.length ? course.outcomes : ["Learn the core workflow", "Practice with guided lessons", "Complete a certificate-ready path"],
    tools: course.tools.length ? course.tools : ["Lessons", "Progress", "Certificate"],
    tags: [course.category, course.level, ...course.tools].map((tag) => tag.toLowerCase()).slice(0, 8),
    modules,
    resources,
    status: status ?? course.status
  };
}
