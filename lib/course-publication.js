const lessonTypes = new Set(["video", "article", "image", "quiz", "assignment", "download"]);
const sourceTypes = new Set(["google-drive", "external-link", "upload", "text"]);
const pricingTypes = new Set(["free", "paid", "subscription", "manual"]);

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value, fallback = "") {
  return String(value ?? "").trim() || fallback;
}

function limited(value, limit, fallback = "") {
  const clean = text(value, fallback);
  return clean.length > limit ? `${clean.slice(0, Math.max(0, limit - 1)).trim()}...` : clean;
}

function numberValue(value, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function optionalUrl(value) {
  const clean = text(value);
  if (!clean) return undefined;
  if (clean.startsWith("/")) return clean;

  try {
    const url = new URL(clean);
    return ["http:", "https:"].includes(url.protocol) ? clean : undefined;
  } catch {
    return undefined;
  }
}

function providerForVideo(url) {
  const clean = text(url).toLowerCase();
  if (!clean) return "";
  if (clean.includes("drive.google.com") || clean.includes("docs.google.com")) return "google-drive";
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) return "youtube";
  if (clean.includes("vimeo.com")) return "vimeo";
  if (clean.includes("cloudinary.com")) return "cloudinary";
  if (/\.(mp4|webm|mov)(\?|$)/.test(clean)) return "direct";
  return "external";
}

function sourceTypeForVideo(url, requested) {
  const clean = text(url);
  if (!clean) return "text";
  const requestedSource = text(requested);
  if (sourceTypes.has(requestedSource)) return requestedSource;
  const provider = providerForVideo(clean);
  if (provider === "google-drive") return "google-drive";
  if (provider === "direct" || provider === "cloudinary") return "upload";
  return "external-link";
}

function normalizeResource(raw, index = 0) {
  if (!isRecord(raw)) return null;
  const url = optionalUrl(raw.url);
  if (!url) return null;
  const title = limited(raw.title ?? raw.label, 180, `Resource ${index + 1}`);

  return {
    label: title,
    title,
    type: limited(raw.type, 80, "File"),
    url,
    accessRule: text(raw.accessRule) === "free" ? "free" : "enrolled",
    downloadable: raw.downloadable !== false
  };
}

function normalizeQuizQuestion(raw, index) {
  if (!isRecord(raw)) return null;
  const options = arrayValue(raw.options).map((option) => limited(option, 240, "Option")).filter(Boolean).slice(0, 6);
  const question = limited(raw.question, 500);
  if (!question || options.length < 2) return null;

  return {
    id: text(raw.id) || `question-${index + 1}`,
    question,
    options,
    correctIndex: Math.max(0, Math.min(options.length - 1, Math.trunc(numberValue(raw.correctIndex, 0)))),
    explanation: raw.explanation ? limited(raw.explanation, 700) : undefined
  };
}

function normalizeLesson(raw, moduleTitle, lessonIndex, course) {
  const record = isRecord(raw) ? raw : {};
  const rawVideoUrl = optionalUrl(record.videoUrl);
  const requestedType = text(record.type);
  const type = lessonTypes.has(requestedType) ? requestedType : rawVideoUrl ? "video" : "article";
  const videoUrl = type === "video" ? rawVideoUrl : undefined;
  const durationMinutes = Math.max(0, Math.trunc(numberValue(record.durationMinutes, type === "quiz" ? 15 : 10)));
  const previewEndSeconds = Math.max(
    30,
    Math.trunc(numberValue(record.previewEndSeconds, numberValue(course.defaultPreviewDuration, 180)))
  );

  return {
    title: limited(record.title, 180, `${moduleTitle} lesson ${lessonIndex + 1}`),
    type,
    sourceType: type === "video" ? sourceTypeForVideo(videoUrl, record.sourceType) : "text",
    durationMinutes,
    durationSeconds: Math.max(0, Math.trunc(numberValue(record.durationSeconds, durationMinutes * 60))),
    summary: limited(record.summary, 1200, text(course.shortDescription) || "Complete this lesson to continue the course."),
    videoUrl,
    videoProvider: videoUrl ? text(record.videoProvider) || providerForVideo(videoUrl) : undefined,
    imageUrl: type === "image" ? optionalUrl(record.imageUrl) : undefined,
    resources: arrayValue(record.resources).map(normalizeResource).filter(Boolean),
    quizQuestions: arrayValue(record.quizQuestions).map(normalizeQuizQuestion).filter(Boolean),
    isPreview: Boolean(record.isPreview || record.freePreview || lessonIndex === 0),
    freePreview: Boolean(record.freePreview || record.isPreview || lessonIndex === 0),
    previewStartSeconds: Math.max(0, Math.trunc(numberValue(record.previewStartSeconds, 0))),
    previewEndSeconds
  };
}

function normalizeModule(raw, moduleIndex, course) {
  const record = isRecord(raw) ? raw : {};
  const title = limited(record.title, 180, `Module ${moduleIndex + 1}`);

  return {
    title,
    description: limited(record.description, 900, text(course.shortDescription) || "Lessons, resources, and completion checks."),
    orderIndex: Math.max(0, Math.trunc(numberValue(record.orderIndex, moduleIndex))),
    status: text(record.status) === "hidden" ? "hidden" : "ready",
    lessons: arrayValue(record.lessons).map((lesson, lessonIndex) => normalizeLesson(lesson, title, lessonIndex, course))
  };
}

function firstVideoUrlFromModules(modules) {
  return modules.flatMap((module) => module.lessons ?? []).find((lesson) => lesson.videoUrl)?.videoUrl;
}

function lessonsCount(modules) {
  return modules.reduce((total, module) => total + arrayValue(module.lessons).length, 0);
}

function chapterTitles(course) {
  const moduleTitles = arrayValue(course.modules).map((module) => (isRecord(module) ? text(module.title) : "")).filter(Boolean);
  if (moduleTitles.length) return moduleTitles;

  const chapters = arrayValue(course.chapters).map((chapter) => text(chapter)).filter(Boolean);
  if (chapters.length) return chapters;

  const outcomes = arrayValue(course.outcomes).map((outcome) => text(outcome)).filter(Boolean).slice(0, 4);
  if (outcomes.length) return outcomes;

  return ["Getting Started"];
}

function fallbackModules(course) {
  const title = text(course.title, "Course");
  const trailerUrl = optionalUrl(course.trailerUrl);
  const titles = chapterTitles(course);

  return titles.map((moduleTitle, moduleIndex) => {
    const hasVideo = Boolean(trailerUrl && moduleIndex === 0);
    const durationMinutes = Math.max(10, Math.round(numberValue(course.defaultPreviewDuration, 600) / 60));

    return {
      title: limited(moduleTitle, 180, moduleIndex === 0 ? "Getting Started" : `Module ${moduleIndex + 1}`),
      description: limited(course.shortDescription ?? course.description, 900, `Start learning ${title}.`),
      orderIndex: moduleIndex,
      status: "ready",
      lessons: [
        {
          title: hasVideo ? `Watch: ${title}` : `Start: ${moduleTitle}`,
          type: hasVideo ? "video" : "article",
          sourceType: hasVideo ? sourceTypeForVideo(trailerUrl) : "text",
          durationMinutes,
          durationSeconds: durationMinutes * 60,
          summary: limited(course.description ?? course.shortDescription, 1200, `Complete this lesson to continue ${title}.`),
          videoUrl: hasVideo ? trailerUrl : undefined,
          videoProvider: hasVideo ? providerForVideo(trailerUrl) : undefined,
          imageUrl: undefined,
          resources: [],
          quizQuestions: [],
          isPreview: moduleIndex === 0,
          freePreview: moduleIndex === 0,
          previewStartSeconds: 0,
          previewEndSeconds: Math.max(90, Math.trunc(numberValue(course.defaultPreviewDuration, 180)))
        }
      ]
    };
  });
}

function normalizedPricingType(course) {
  const pricingType = text(course.pricingType);
  if (pricingType === "subscription" || pricingType === "manual") return pricingType;
  if (pricingType === "free" || numberValue(course.price, 0) <= 0) return "free";
  if (pricingTypes.has(pricingType)) return pricingType;
  return "paid";
}

export function compileCoursePublicationPatch(source, requestedStatus) {
  const course = isRecord(source) ? source : {};
  const status = text(requestedStatus, text(course.status, "draft"));
  const issues = [];
  let modules = arrayValue(course.modules).map((module, index) => normalizeModule(module, index, course));

  if (status === "published" && lessonsCount(modules) === 0) {
    modules = fallbackModules(course);
    issues.push("Published course had no saved lessons; a starter learning module was compiled from existing course data.");
  }

  const count = lessonsCount(modules);
  const firstVideoUrl = firstVideoUrlFromModules(modules);
  const publishedAt = course.publishedAt ? new Date(course.publishedAt) : new Date();

  return {
    modules,
    lessonsCount: count,
    trailerUrl: optionalUrl(course.trailerUrl) || firstVideoUrl,
    pricingType: normalizedPricingType(course),
    status,
    publicationStatus: status === "published" ? "published" : status === "archived" ? "archived" : count > 0 ? "ready" : "draft",
    publicationIssues: issues,
    lastCompiledAt: new Date(),
    ...(status === "published" ? { publishedAt } : {})
  };
}

export function courseHasPublishableLessons(course) {
  return lessonsCount(arrayValue(course?.modules)) > 0;
}
