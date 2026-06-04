"use client";

import Link from "next/link";
import { AlertTriangle, BookOpen } from "lucide-react";
import { CourseLearningWorkspace } from "@/components/platform/course-learning-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeCourseImage, titleFromCourseSlug } from "@/lib/course-media";
import { videoSourceForUrl } from "@/lib/video-sources";
import { type CourseAssetDraft, type CourseLessonDraft, type CourseQuizDraft, usePlatformStore } from "@/hooks/use-platform-store";

type SnapshotCourse = Parameters<typeof CourseLearningWorkspace>[0]["course"];
type SnapshotProgress = Parameters<typeof CourseLearningWorkspace>[0]["initialProgress"];

function playableVideoUrl(...urls: Array<string | undefined>) {
  const playable = urls.find((url) => {
    const source = videoSourceForUrl(url);
    return source.provider !== "empty" && source.provider !== "unsupported";
  });

  return playable || "";
}

function assetUrl(asset?: CourseAssetDraft) {
  return asset?.embedUrl || asset?.playbackUrl || asset?.url || "";
}

function assetToLesson(asset: CourseAssetDraft, chapterId: string, index: number): CourseLessonDraft {
  const type = asset.type === "video" ? "video" : asset.type === "image" ? "image" : "download";

  return {
    id: `asset-lesson-${asset.id}`,
    courseSlug: asset.courseSlug,
    chapterId,
    title:
      type === "video"
        ? `Watch: ${asset.title}`
        : type === "image"
          ? `View: ${asset.title}`
          : `Download: ${asset.title}`,
    type,
    durationMinutes: type === "video" ? Math.max(5, Math.round((asset.durationSeconds ?? 1200) / 60)) : 10,
    summary: `${asset.title} was uploaded by the instructor for this course.`,
    content: type === "video" ? "Watch this instructor video in the course player." : "Use this instructor-provided resource to complete the lesson.",
    videoUrl: type === "video" ? assetUrl(asset) : "",
    imageUrl: type === "image" ? asset.url : "",
    assetIds: [asset.id],
    resources: type === "video" ? [] : [{ label: asset.title, url: asset.url }],
    isPreview: index === 0,
    order: 1000 + index,
    createdAt: asset.createdAt,
    updatedAt: asset.createdAt
  };
}

function quizToLesson(quiz: CourseQuizDraft, chapterId: string, index: number): CourseLessonDraft {
  return {
    id: `quiz-lesson-${quiz.id}`,
    courseSlug: quiz.courseSlug,
    chapterId,
    title: quiz.title,
    type: "quiz",
    durationMinutes: Math.max(10, quiz.questions.length * 3),
    summary: `Pass this ${quiz.kind} with ${quiz.passingScore}% or higher.`,
    content: `Answer ${quiz.questions.length} multiple-choice questions. You have ${quiz.maxAttempts} attempts.`,
    videoUrl: "",
    imageUrl: "",
    assetIds: [],
    resources: [],
    isPreview: false,
    order: 2000 + index,
    createdAt: quiz.createdAt,
    updatedAt: quiz.createdAt
  };
}

function localCourseStructure(courseId: string): SnapshotCourse | null {
  const state = usePlatformStore.getState();
  const course = state.createdCourses.find((item) => item.slug === courseId);

  if (!course) return null;

  const chapters = state.courseChapters[course.slug]?.length
    ? state.courseChapters[course.slug].slice().sort((left, right) => left.order - right.order)
    : course.chapters.map((chapter, index) => ({
        id: `${course.slug}-${index + 1}`,
        title: chapter,
        description: `${chapter} lessons, resources, quiz checks, and completion tracking.`,
        order: index + 1,
        estimatedMinutes: 35 + index * 10
      }));
  const assets = state.courseAssets.filter((asset) => asset.courseSlug === course.slug);
  const storedLessons = state.courseLessons[course.slug] ?? [];
  const quizzes = state.courseQuizzes.filter((quiz) => quiz.courseSlug === course.slug);
  const firstVideo = assets.find((asset) => asset.type === "video");
  const firstVideoUrl = playableVideoUrl(course.trailerUrl, assetUrl(firstVideo));
  const lessonAssetIds = new Set(storedLessons.flatMap((lesson) => lesson.assetIds));
  const generatedAssetLessons = assets
    .filter((asset) => !lessonAssetIds.has(asset.id))
    .map((asset, index) => assetToLesson(asset, asset.chapterId || chapters[index % Math.max(1, chapters.length)]?.id || chapters[0]?.id || `${course.slug}-assets`, index));
  const explicitLessons = [...storedLessons, ...generatedAssetLessons];

  const modules = chapters.map((chapter, moduleIndex) => {
    const title = chapter.title;
    const chapterLessons = explicitLessons
      .filter((lesson) => lesson.chapterId === chapter.id)
      .slice()
      .sort((left, right) => left.order - right.order);
    const chapterQuizLessons = quizzes
      .filter((quiz) => (quiz.chapterId ? quiz.chapterId === chapter.id : moduleIndex === 0))
      .filter((quiz) => !chapterLessons.some((lesson) => lesson.id === `quiz-lesson-${quiz.id}`))
      .map((quiz, quizIndex) => quizToLesson(quiz, chapter.id, quizIndex));
    const chapterLearningItems = [...chapterLessons, ...chapterQuizLessons].sort((left, right) => left.order - right.order);

    return {
      key: `m${moduleIndex + 1}`,
      title,
      description: chapter.description,
      lessons: chapterLearningItems.map((explicitLesson, lessonIndex) => {
        const type = explicitLesson?.type ?? "article";
        const quiz = explicitLesson?.id.startsWith("quiz-lesson-")
          ? quizzes.find((item) => `quiz-lesson-${item.id}` === explicitLesson.id)
          : quizzes.find((item) => item.chapterId === chapter.id);
        const lessonAssets = assets.filter((asset) => explicitLesson?.assetIds.includes(asset.id));
        const videoAsset = lessonAssets.find((asset) => asset.type === "video");
        const imageAsset = lessonAssets.find((asset) => asset.type === "image");
        const resources = [
          ...(explicitLesson?.resources ?? []),
          ...lessonAssets
            .filter((asset) => asset.type !== "video")
            .map((asset) => ({ label: asset.title, url: asset.url }))
        ].filter((resource, index, list) => list.findIndex((item) => item.url === resource.url) === index);

        return {
          key: explicitLesson?.id ?? `m${moduleIndex + 1}-l${lessonIndex + 1}`,
          title:
            explicitLesson?.title ??
            (type === "video"
              ? `Watch: ${title}`
              : type === "article"
                ? `Read: ${title}`
                : type === "image"
                  ? `View: ${title} reference`
                  : type === "download"
                    ? `Download: ${title} resources`
                    : type === "assignment"
                      ? `Practice lab: ${title}`
                      : `Checkpoint quiz: ${title}`),
          type,
          durationMinutes: explicitLesson?.durationMinutes ?? (type === "quiz" ? 15 : 20),
          videoUrl:
            type === "video"
              ? playableVideoUrl(explicitLesson?.videoUrl, assetUrl(videoAsset), moduleIndex === 0 && lessonIndex === 0 ? firstVideoUrl : undefined)
              : "",
          imageUrl: type === "image" ? explicitLesson?.imageUrl || imageAsset?.url || resources[0]?.url || "" : "",
          resources,
          quizQuestions: quiz?.questions.map((question) => ({
            id: question.id,
            question: question.question,
            options: question.options,
            correctIndex: question.correctIndex
          })),
          isPreview: explicitLesson?.isPreview ?? (moduleIndex === 0 && lessonIndex === 0),
          summary: explicitLesson?.content || explicitLesson?.summary || `Complete this ${type} lesson to advance through ${course.title}.`
        };
      })
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

  return {
    id: course.slug,
    title: course.title,
    slug: course.slug,
    shortDescription: `${course.title} learning workspace`,
    description: `${course.title} course workspace with lessons, resources, quizzes, assignments, and certificates.`,
    instructor: course.instructor,
    level: course.level,
    category: course.category,
    certificate: course.certificate,
    image: normalizeCourseImage(course.image, course.category),
    outcomes: course.outcomes,
    tools: course.tools,
    modules,
    flatLessons,
    totalLessons: flatLessons.length,
    totalMinutes: flatLessons.reduce((total, lesson) => total + lesson.durationMinutes, 0)
  };
}

function emptyProgress(course: SnapshotCourse): SnapshotProgress {
  return {
    completedLessonKeys: [],
    currentLessonKey: course.flatLessons[0]?.key ?? "",
    progressPercent: 0,
    status: "active",
    certificateIssuedAt: null,
    events: []
  };
}

export function CourseLearningEntry({
  courseId,
  learnerName,
  databaseMessage
}: {
  courseId: string;
  learnerName: string;
  databaseMessage?: string | null;
}) {
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const course = createdCourses.some((item) => item.slug === courseId) ? localCourseStructure(courseId) : null;

  if (course) {
    return <CourseLearningWorkspace course={course} initialProgress={emptyProgress(course)} learnerName={learnerName} />;
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <CardTitle>{titleFromCourseSlug(courseId)} is not ready yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {databaseMessage ?? "Publish this course in the instructor studio or restore the database connection to open the learner workspace."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/my-courses">
                <BookOpen className="size-4" aria-hidden="true" />
                My courses
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/instructor/courses/create">Instructor studio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
