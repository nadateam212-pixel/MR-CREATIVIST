"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  GraduationCap,
  Layers3,
  PlayCircle,
  Star,
  Users,
  Video
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { isFreePrice } from "@/lib/currency";
import { courseImageForCategory, normalizeCourseImage, titleFromCourseSlug } from "@/lib/course-media";
import { videoSourceForUrl } from "@/lib/video-sources";
import { type PlatformCourseDraft, usePlatformStore } from "@/hooks/use-platform-store";

type CoursePreview = {
  id?: string;
  title: string;
  slug: string;
  level: string;
  category: string;
  price: string;
  compareAt?: string;
  rating: number;
  learners: number;
  duration: string;
  lessons: number;
  progress: number;
  instructor: string;
  certificate: string;
  image: string;
  trailerUrl?: string;
  description?: string;
  outcomes: string[];
  chapters: string[];
  tools: string[];
  modules?: CourseModulePreview[];
  resources?: CourseResourcePreview[];
  status?: string;
};

type CourseResourcePreview = {
  label?: string;
  title?: string;
  type?: string;
  url?: string;
  accessRule?: string;
  downloadable?: boolean;
  description?: string;
};

type CourseLessonPreview = {
  title?: string;
  type?: "video" | "article" | "image" | "quiz" | "assignment" | "download" | string;
  sourceType?: string;
  durationMinutes?: number;
  durationSeconds?: number;
  summary?: string;
  videoUrl?: string;
  imageUrl?: string;
  resources?: CourseResourcePreview[];
  isPreview?: boolean;
  freePreview?: boolean;
};

type CourseModulePreview = {
  title?: string;
  description?: string;
  orderIndex?: number;
  status?: string;
  lessons?: CourseLessonPreview[];
};

type CurriculumModule = {
  title: string;
  description: string;
  lessons: Array<{
    title: string;
    type: string;
    durationMinutes: number;
    videoUrl: string;
    resources: CourseResourcePreview[];
    summary: string;
    isPreview: boolean;
  }>;
};

function localCourseToPreview(course: PlatformCourseDraft): CoursePreview {
  return {
    title: course.title,
    slug: course.slug,
    level: course.level,
    category: course.category,
    price: course.price,
    compareAt: course.compareAt,
    rating: course.rating,
    learners: course.learners,
    duration: course.duration,
    lessons: course.lessons,
    progress: course.progress,
    instructor: course.instructor,
    certificate: course.certificate,
    image: normalizeCourseImage(course.image, course.category),
    trailerUrl: course.trailerUrl,
    description: `${course.title} is a practical course path with lessons, resources, assessments, uploads, and certificate readiness.`,
    outcomes: course.outcomes,
    chapters: course.chapters,
    tools: course.tools,
    resources: [],
    status: course.status
  };
}

function fallbackCourseToPreview(slug: string): CoursePreview {
  const title = titleFromCourseSlug(slug);

  return {
    title,
    slug,
    level: "Beginner",
    category: "Course",
    price: "$0",
    compareAt: "",
    rating: 0,
    learners: 0,
    duration: "Self-paced",
    lessons: 0,
    progress: 0,
    instructor: "MR Creativist Instructor",
    certificate: "Completion certificate",
    image: courseImageForCategory("Course"),
    trailerUrl: "",
    description: "This course is not published yet.",
    outcomes: [],
    chapters: [],
    tools: [],
    resources: [],
    status: "preview"
  };
}

function countLabel(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function embeddedPreviewClass(provider: string) {
  if (provider === "youtube") return "absolute inset-x-0 -top-[14%] h-[128%] w-full border-0";
  if (provider === "vimeo") return "absolute inset-x-0 -top-[10%] h-[120%] w-full border-0";
  if (provider === "google-drive") return "absolute inset-x-0 -top-12 h-[calc(100%+6rem)] w-full border-0";

  return "absolute inset-0 h-full w-full border-0";
}

function playableVideoUrl(...urls: Array<string | undefined>) {
  const playable = urls.find((url) => {
    const source = videoSourceForUrl(url);
    return source.provider !== "empty" && source.provider !== "unsupported";
  });

  return playable || "";
}

function resourceLabel(resource: CourseResourcePreview, index: number) {
  return resource.label || resource.title || `Resource ${index + 1}`;
}

function normalizedResources(resources?: CourseResourcePreview[]) {
  return Array.isArray(resources)
    ? resources.filter((resource) => resource.url).map((resource, index) => ({
        ...resource,
        label: resourceLabel(resource, index)
      }))
    : [];
}

function lessonDurationMinutes(lesson: CourseLessonPreview) {
  const minutes = Number(lesson.durationMinutes ?? 0);
  if (minutes > 0) return minutes;

  const seconds = Number(lesson.durationSeconds ?? 0);
  return seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0;
}

function formatLessonMinutes(minutes: number) {
  if (minutes <= 0) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function CoursePreviewPlayer({
  title,
  url,
  poster
}: {
  title: string;
  url: string;
  poster: string;
}) {
  const source = useMemo(
    () => videoSourceForUrl(url, { controls: false, origin: typeof window === "undefined" ? undefined : window.location.origin }),
    [url]
  );

  if (source.provider === "direct") {
    return (
      <video
        src={source.playbackUrl}
        poster={poster}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        className="h-full min-h-[22rem] w-full bg-black object-cover"
      />
    );
  }

  if (source.isIframe) {
    return (
      <div className="relative h-full min-h-[22rem] w-full overflow-hidden bg-black">
        <iframe
          src={source.embedUrl}
          title="Course preview video"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className={embeddedPreviewClass(source.provider)}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-[22rem]">
      <SafeImage
        src={poster}
        fallbackSrc={courseImageForCategory("Course")}
        alt={title}
        fill
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-cover"
        priority
      />
    </div>
  );
}

export function CourseDetailExperience({
  slug,
  initialCourse
}: {
  slug: string;
  initialCourse?: CoursePreview | null;
}) {
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const courseChapters = usePlatformStore((state) => state.courseChapters);
  const courseAssets = usePlatformStore((state) => state.courseAssets);
  const enrolledCourseSlugs = usePlatformStore((state) => state.enrolledCourseSlugs);
  const localCourse = createdCourses.find((course) => course.slug === slug);

  const course = useMemo(() => {
    if (initialCourse) {
      return {
        ...initialCourse,
        image: normalizeCourseImage(initialCourse.image, initialCourse.category)
      };
    }

    return localCourse ? localCourseToPreview(localCourse) : fallbackCourseToPreview(slug);
  }, [initialCourse, localCourse, slug]);

  const curriculum = useMemo<CurriculumModule[]>(() => {
    if (!course) return [];

    if (course.modules?.length) {
      return course.modules
        .slice()
        .filter((module) => module.status !== "hidden")
        .sort((left, right) => Number(left.orderIndex ?? 0) - Number(right.orderIndex ?? 0))
        .map((module, moduleIndex) => ({
          title: module.title || `Module ${moduleIndex + 1}`,
          description: module.description || "",
          lessons: (module.lessons ?? []).map((lesson, lessonIndex) => ({
            title: lesson.title || `Lesson ${lessonIndex + 1}`,
            type: lesson.type || "article",
            durationMinutes: lessonDurationMinutes(lesson),
            videoUrl: playableVideoUrl(lesson.videoUrl),
            resources: normalizedResources(lesson.resources),
            summary: lesson.summary || "",
            isPreview: Boolean(lesson.isPreview || lesson.freePreview)
          }))
        }));
    }

    const localChapters = courseChapters[course.slug];
    if (localChapters?.length) {
      return localChapters
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((chapter) => ({
          title: chapter.title,
          description: chapter.description,
          lessons: []
        }));
    }

    return course.chapters.map((chapter) => ({
      title: chapter,
      description: "",
      lessons: []
    }));
  }, [course, courseChapters]);

  const assets = course ? courseAssets.filter((asset) => asset.courseSlug === course.slug) : [];
  const firstVideoAsset = assets.find((asset) => asset.type === "video");
  const flatLessons = curriculum.flatMap((module) => module.lessons);
  const firstPreviewLesson = flatLessons.find((lesson) => lesson.isPreview && lesson.videoUrl);
  const firstVideoLesson = flatLessons.find((lesson) => lesson.videoUrl);
  const courseResources = normalizedResources(course.resources);
  const lessonResources = flatLessons.flatMap((lesson) => lesson.resources);
  const previewVideoUrl =
    playableVideoUrl(
      course.trailerUrl,
      firstPreviewLesson?.videoUrl,
      firstVideoLesson?.videoUrl,
      firstVideoAsset?.embedUrl,
      firstVideoAsset?.playbackUrl,
      firstVideoAsset?.url
    ) ||
    firstVideoAsset?.embedUrl ||
    firstVideoAsset?.playbackUrl ||
    firstVideoAsset?.url ||
    "";
  const videos = flatLessons.filter((lesson) => lesson.videoUrl).length + assets.filter((asset) => asset.type === "video").length;
  const resources = courseResources.length + lessonResources.length + assets.filter((asset) => asset.type !== "video").length;
  const enrolled = course ? enrolledCourseSlugs.includes(course.slug) : false;
  const totalMinutes = flatLessons.reduce((total, lesson) => total + lesson.durationMinutes, 0);
  const effort = totalMinutes > 0 ? `${Math.max(1, Math.round(totalMinutes / 60))} hours` : course?.duration ?? "Self-paced";
  const outcomes = course?.outcomes?.length ? course.outcomes : [];
  const tools = course?.tools?.length ? course.tools : [];
  const freeCourse = isFreePrice(course.price);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <div className="grid overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="min-h-[22rem] bg-black">
              <CoursePreviewPlayer
                title={course.title}
                url={previewVideoUrl}
                poster={course.image}
              />
            </div>
            <div className="p-6 lg:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge>{course.category}</Badge>
                <Badge>{course.level}</Badge>
                {freeCourse ? <Badge className="border-[hsl(var(--primary))] text-[hsl(var(--primary))]">Free</Badge> : null}
                {course.status ? <Badge>{course.status}</Badge> : null}
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">{course.title}</h1>
              <p className="mt-4 leading-7 text-[hsl(var(--muted-foreground))]">
                {course.description ?? "A complete guided path from first lesson to proof of completion."}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Level", value: course.level, icon: GraduationCap },
                  { label: "Effort", value: effort, icon: Clock },
                  { label: "Certificate", value: course.certificate, icon: Award }
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-[hsl(var(--border))] p-3">
                    <item.icon className="mb-2 size-4 text-[hsl(var(--primary))]" />
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Rating", value: course.rating.toFixed(1), icon: Star },
              { label: "Learners", value: course.learners.toLocaleString(), icon: Users },
              { label: "Curriculum", value: `${countLabel(curriculum.length, "module")} / ${countLabel(flatLessons.length, "lesson")}`, icon: Layers3 },
              { label: "Assets", value: `${videos} videos / ${resources} files`, icon: Video }
            ].map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-4">
                  <metric.icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                  <p className="mt-1 text-xl font-semibold">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>What you will learn</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {outcomes.length ? (
                outcomes.map((outcome) => (
                  <div key={outcome} className="rounded-md border border-[hsl(var(--border))] p-4">
                    <CheckCircle2 className="mb-3 size-5 text-[hsl(var(--primary))]" />
                    <p className="font-medium">{outcome}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))] md:col-span-2">
                  Learning outcomes will appear after the instructor publishes them.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Curriculum</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {curriculum.length ? (
                curriculum.map((module, index) => (
                  <div key={`${module.title}-${index}`} className="rounded-md border border-[hsl(var(--border))] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[hsl(var(--primary))]">Module {String(index + 1).padStart(2, "0")}</p>
                        <h2 className="mt-1 font-semibold">{module.title}</h2>
                        {module.description ? (
                          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{module.description}</p>
                        ) : null}
                      </div>
                      <Badge>{countLabel(module.lessons.length, "lesson")}</Badge>
                    </div>
                    {module.lessons.length ? (
                      <div className="mt-4 grid gap-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={`${module.title}-${lesson.title}-${lessonIndex}`} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                {lesson.summary ? <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{lesson.summary}</p> : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge>{lesson.type}</Badge>
                                <Badge>{formatLessonMinutes(lesson.durationMinutes)}</Badge>
                                {lesson.videoUrl ? <Badge className="border-emerald-500/45 text-emerald-600">Video</Badge> : null}
                                {lesson.isPreview ? <Badge className="border-sky-500/45 text-sky-600">Preview</Badge> : null}
                              </div>
                            </div>
                            {lesson.resources.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {lesson.resources.map((resource, resourceIndex) => (
                                  <Button key={`${lesson.title}-${resource.url}-${resourceIndex}`} asChild size="sm" variant="outline">
                                    <a href={resource.url} target="_blank" rel="noreferrer" download={resource.downloadable ? "" : undefined}>
                                      <Download className="size-4" />
                                      {resourceLabel(resource, resourceIndex)}
                                    </a>
                                  </Button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 rounded-md border border-dashed border-[hsl(var(--border))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                        No lessons are published in this module yet.
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                  Curriculum modules will appear once the instructor publishes them.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course downloads</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {courseResources.length ? (
                courseResources.map((resource, index) => (
                  <a
                    key={`${resource.url}-${index}`}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    download={resource.downloadable ? "" : undefined}
                    className="rounded-md border border-[hsl(var(--border))] p-4 hover:bg-[hsl(var(--muted))]/50"
                  >
                    <Download className="mb-3 size-5 text-[hsl(var(--primary))]" />
                    <p className="font-medium">{resourceLabel(resource, index)}</p>
                    {resource.description ? <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{resource.description}</p> : null}
                  </a>
                ))
              ) : (
                <div className="rounded-md border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))] md:col-span-2">
                  No course downloads are published yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>
                <PriceDisplay
                  price={course.price}
                  compareAt={course.compareAt}
                  className="text-3xl text-[hsl(var(--primary))]"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={course.progress} />
              <div className="grid gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <p>Instructor: {course.instructor}</p>
                <p>{flatLessons.length || course.lessons || 0} lessons / {effort}</p>
                <p>Wallet, Stripe, PayPal, and mobile money ready.</p>
              </div>
              <Button asChild className="w-full">
                <Link href={enrolled ? `/dashboard/learning/${course.slug}` : `/courses/${course.slug}/enroll`}>
                  <PlayCircle className="size-4" />
                  {enrolled ? "Continue learning" : freeCourse ? "Enroll free" : "Enroll now"}
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/dashboard/learning/${course.slug}`}>
                  <BookOpen className="size-4" />
                  Preview course player
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Included tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {tools.length ? (
                tools.map((tool) => (
                  <div key={tool} className="flex items-center gap-2 text-sm">
                    <FileCheck2 className="size-4 text-[hsl(var(--primary))]" />
                    {tool}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Instructor tools will appear here after publishing.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learner path</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {["Enroll", "Watch", "Practice", "Pass quiz", "Submit work", "Earn certificate"].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-md bg-[hsl(var(--muted))] text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="size-5 text-[hsl(var(--primary))]" />
                <div>
                  <p className="font-semibold">Built for outcomes</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Skills, curriculum, progress, assessments, and certificates on one path.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
