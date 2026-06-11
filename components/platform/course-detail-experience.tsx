"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Heart,
  Layers3,
  Lock,
  MessageCircle,
  Pause,
  Play,
  PlayCircle,
  Share2,
  Star,
  Video
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { ProtectedVideoOverlays } from "@/components/platform/protected-video-overlays";
import { accessBadgeClass, accessLabel, courseAccessType } from "@/lib/access-styles";
import { courseImageForCategory, normalizeCourseImage, titleFromCourseSlug } from "@/lib/course-media";
import { videoSourceForUrl } from "@/lib/video-sources";
import { usePlatformStore } from "@/hooks/use-platform-store";

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
  instructorAvatar?: string;
  instructorVerified?: boolean;
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
  pricingType?: string;
  accessType?: string;
  likes?: number;
  shareCount?: number;
  commentCount?: number;
  replyCount?: number;
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

type CourseEngagement = {
  likes: number;
  liked: boolean;
  shareCount: number;
  comments: number;
  replies: number;
  commentCount: number;
};

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
    accessType: "free",
    status: "preview"
  };
}

function countLabel(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function compactCount(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    Math.max(0, value)
  );
}

function embeddedPreviewClass(provider?: string) {
  if (provider === "google-drive") return "absolute -top-[7%] left-0 h-[114%] w-full border-0";
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

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  poster,
  courseSlug,
  previewGateActive,
  previewSecondsLimit
}: {
  title: string;
  url: string;
  poster: string;
  courseSlug: string;
  previewGateActive: boolean;
  previewSecondsLimit: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const source = useMemo(
    () => videoSourceForUrl(url, { controls: false, origin: typeof window === "undefined" ? undefined : window.location.origin }),
    [url]
  );
  const blocked = previewGateActive && elapsedSeconds >= previewSecondsLimit;

  useEffect(() => {
    if (!previewGateActive || blocked) return undefined;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (source.provider === "direct" && !playing) return;
      setElapsedSeconds((current) => Math.min(previewSecondsLimit, current + 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [blocked, playing, previewGateActive, previewSecondsLimit, source.provider]);

  useEffect(() => {
    if (!blocked) return;

    videoRef.current?.pause();
    if (iframeRef.current && source.embedUrl) iframeRef.current.src = source.embedUrl;
  }, [blocked, source.embedUrl]);

  async function toggleDirectPreview() {
    if (!videoRef.current || blocked) return;

    if (videoRef.current.paused) {
      await videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }

  function paywallOverlay() {
    if (!blocked) return null;

    return (
      <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-4 text-white backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-lg border border-white/15 bg-black/80 p-5 text-center shadow-xl">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-white/10">
            <Lock className="size-6" />
          </div>
          <h2 className="text-lg font-bold">Enrollment required</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Your paid preview has ended. Unlock the full course to keep watching and save progress.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link href={`/courses/${courseSlug}/enroll`}>
              <CreditCard className="size-4" />
              Enroll or pay
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (source.provider === "direct") {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={source.playbackUrl}
          poster={poster}
          playsInline
          controls={false}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          className="h-full w-full bg-black object-contain"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        <button
          type="button"
          onClick={() => void toggleDirectPreview()}
          disabled={blocked}
          className="group absolute inset-0 grid place-items-center text-white transition hover:bg-black/10 disabled:cursor-not-allowed"
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          <span className={`grid size-16 place-items-center rounded-2xl bg-black/75 shadow-lg transition ${playing ? "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" : "opacity-100"}`}>
            {playing ? <Pause className="size-8" /> : <Play className="ml-1 size-8 fill-current" />}
          </span>
        </button>
        {paywallOverlay()}
      </div>
    );
  }

  if (source.isIframe) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <iframe
          ref={iframeRef}
          src={source.embedUrl}
          title="Course preview video"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-same-origin allow-scripts allow-presentation"
          className={embeddedPreviewClass(source.provider)}
        />
        <ProtectedVideoOverlays />
        {paywallOverlay()}
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black">
      <SafeImage
        src={poster}
        fallbackSrc={courseImageForCategory("Course")}
        alt={title}
        fill
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-contain"
        priority
      />
      {paywallOverlay()}
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
  const enrolledCourseSlugs = usePlatformStore((state) => state.enrolledCourseSlugs);

  const course = useMemo(() => {
    if (initialCourse) {
      return {
        ...initialCourse,
        image: normalizeCourseImage(initialCourse.image, initialCourse.category)
      };
    }

    return fallbackCourseToPreview(slug);
  }, [initialCourse, slug]);

  const curriculum = useMemo<CurriculumModule[]>(() => {
    if (!course) return [];

    const databaseModules = course.modules ?? [];
    const sourceModules = databaseModules.some((module) => (module.lessons ?? []).length) ? databaseModules : [];

    if (sourceModules.length) {
      return sourceModules
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

    return course.chapters.map((chapter) => ({
      title: chapter,
      description: "",
      lessons: []
    }));
  }, [course]);

  const flatLessons = curriculum.flatMap((module) => module.lessons);
  const firstPreviewLesson = flatLessons.find((lesson) => lesson.isPreview && lesson.videoUrl);
  const firstVideoLesson = flatLessons.find((lesson) => lesson.videoUrl);
  const courseResources = normalizedResources(course.resources);
  const previewVideoUrl =
    playableVideoUrl(
      course.trailerUrl,
      firstPreviewLesson?.videoUrl,
      firstVideoLesson?.videoUrl
    );
  const videos = flatLessons.filter((lesson) => lesson.videoUrl).length;
  const enrolled = course ? enrolledCourseSlugs.includes(course.slug) : false;
  const totalMinutes = flatLessons.reduce((total, lesson) => total + lesson.durationMinutes, 0);
  const effort = totalMinutes > 0 ? `${Math.max(1, Math.round(totalMinutes / 60))} hours` : course?.duration ?? "Self-paced";
  const outcomes = course?.outcomes?.length ? course.outcomes : [];
  const previewLessons = flatLessons.slice(0, 8);
  const accessType = courseAccessType(course);
  const accessText = accessLabel(accessType);
  const freeCourse = accessType === "free";
  const previewSecondsLimit = Math.max(30, Number(process.env.NEXT_PUBLIC_COURSE_PREVIEW_SECONDS ?? 120) || 120);
  const previewGateActive = !enrolled && accessType !== "free";
  const learningHref = enrolled
    ? `/dashboard/learning/${course.slug}`
    : freeCourse
      ? `/courses/${course.slug}/enroll`
      : `/courses/${course.slug}/preview`;
  const learningLabel = enrolled
    ? "Continue learning"
    : freeCourse
      ? "Start free course"
      : "Course tracking";
  const commentHref = enrolled ? `/dashboard/learning/${course.slug}#comments` : `/courses/${course.slug}/preview#comments`;
  const [engagement, setEngagement] = useState<CourseEngagement>({
    likes: Number(course.likes ?? 0),
    liked: false,
    shareCount: Number(course.shareCount ?? 0),
    comments: Math.max(0, Number(course.commentCount ?? 0) - Number(course.replyCount ?? 0)),
    replies: Number(course.replyCount ?? 0),
    commentCount: Number(course.commentCount ?? 0)
  });
  const [engagementLoading, setEngagementLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEngagement() {
      try {
        const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/engagement`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error ?? "Course engagement could not load.");
        if (!cancelled) setEngagement(data);
      } catch {
        // Keep the initial course counts if the public engagement endpoint is temporarily unavailable.
      }
    }

    void loadEngagement();

    return () => {
      cancelled = true;
    };
  }, [course.slug]);

  async function toggleCourseLike() {
    let previous: CourseEngagement | null = null;
    setEngagementLoading(true);
    setEngagement((current) => {
      previous = current;
      const liked = !current.liked;
      const likes = Math.max(0, Number(current.likes ?? 0) + (liked ? 1 : -1));

      return { ...current, liked, likes };
    });

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_like" })
      });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error ?? "Like could not be saved.");
      setEngagement(data);
    } catch {
      if (previous) setEngagement(previous);
    } finally {
      setEngagementLoading(false);
    }
  }

  async function shareCourse() {
    const href = typeof window === "undefined" ? `/courses/${course.slug}` : `${window.location.origin}/courses/${course.slug}`;
    const nav: (Navigator & { share?: (data: ShareData) => Promise<void> }) | null =
      typeof window === "undefined" ? null : window.navigator;

    try {
      if (nav?.share) {
        await nav.share({ title: course.title, text: course.description, url: href });
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(href);
        toast.success("Course link copied.");
      }

      const response = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" })
      });
      const data = await response.json();
      if (response.ok && !data.error) setEngagement(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Share could not be completed.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="bg-black">
              <CoursePreviewPlayer
                title={course.title}
                url={previewVideoUrl}
                poster={course.image}
                courseSlug={course.slug}
                previewGateActive={previewGateActive}
                previewSecondsLimit={previewSecondsLimit}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 sm:justify-end">
              <Button
                type="button"
                size="sm"
                variant={engagement.liked ? "default" : "outline"}
                onClick={() => void toggleCourseLike()}
                disabled={engagementLoading}
              >
                <Heart className={`size-4 ${engagement.liked ? "fill-current" : ""}`} />
                {compactCount(engagement.likes)}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={commentHref}>
                  <MessageCircle className="size-4" />
                  <span>{compactCount(engagement.commentCount || engagement.comments + engagement.replies)}</span>
                  <span className="hidden sm:inline">comments</span>
                </Link>
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void shareCourse()}>
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Share</span>
                {engagement.shareCount ? <span>{compactCount(engagement.shareCount)}</span> : null}
              </Button>
            </div>
            <CardContent className="space-y-5 p-5 lg:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{course.category}</Badge>
                <Badge>{course.level}</Badge>
                <Badge className={accessBadgeClass(accessType)}>{accessText}</Badge>
                {course.status ? <Badge>{course.status}</Badge> : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{course.title}</h1>
                  <p className="mt-3 max-w-3xl leading-7 text-[hsl(var(--muted-foreground))]">
                    {course.description ?? "A complete guided path from first lesson to proof of completion."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={learningHref}>
                      <PlayCircle className="size-4" />
                      {learningLabel}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-y border-[hsl(var(--border))] py-4">
                <span
                  className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[hsl(var(--primary))]/10 text-sm font-black text-[hsl(var(--primary))]"
                  style={course.instructorAvatar ? { backgroundImage: `url(${course.instructorAvatar})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
                >
                  {course.instructorAvatar ? null : initials(course.instructor || "MC")}
                </span>
                <div className="min-w-0">
                  <p className="inline-flex max-w-full items-center gap-1.5 font-bold">
                    <span className="truncate">{course.instructor}</span>
                    {course.instructorVerified ? <VerifiedMark label="Verified instructor" /> : null}
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {compactCount(course.learners)} learners - {compactCount(course.likes ?? 0)} likes
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap gap-2 text-sm">
                  <Badge><Star className="mr-1 size-3.5 fill-amber-400 text-amber-400" /> {course.rating.toFixed(1)}</Badge>
                  <Badge><Layers3 className="mr-1 size-3.5" /> {countLabel(curriculum.length, "module")}</Badge>
                  <Badge><Video className="mr-1 size-3.5" /> {videos} videos</Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Effort", value: effort, icon: Clock },
                  { label: "Lessons", value: countLabel(flatLessons.length || course.lessons || 0, "lesson"), icon: BookOpen },
                  { label: "Certificate", value: course.certificate, icon: Award }
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-[hsl(var(--border))] p-3">
                    <item.icon className="mb-2 size-4 text-[hsl(var(--primary))]" />
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">
                {course.description || "Course details will appear here after publishing."}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {(outcomes.length ? outcomes : ["Follow a clear lesson path", "Practice with guided checkpoints", "Finish with certificate-ready progress"]).map((outcome) => (
                  <div key={outcome} className="rounded-md border border-[hsl(var(--border))] p-4">
                    <CheckCircle2 className="mb-3 size-5 text-[hsl(var(--primary))]" />
                    <p className="font-medium">{outcome}</p>
                  </div>
                ))}
              </div>
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
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--primary))]">Module {String(index + 1).padStart(2, "0")}</p>
                        <h2 className="mt-1 font-semibold">{module.title}</h2>
                        {module.description ? <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{module.description}</p> : null}
                      </div>
                      <Badge>{countLabel(module.lessons.length, "lesson")}</Badge>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {module.lessons.length ? module.lessons.map((lesson, lessonIndex) => (
                        <div key={`${module.title}-${lesson.title}-${lessonIndex}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
                          <div className="min-w-0">
                            <p className="font-medium">{lesson.title}</p>
                            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{lesson.type} - {formatLessonMinutes(lesson.durationMinutes)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {lesson.videoUrl ? <Badge className="border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]">Video</Badge> : null}
                            {lesson.isPreview ? <Badge>Preview</Badge> : null}
                          </div>
                        </div>
                      )) : (
                        <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                          No lessons are published in this module yet.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                  Curriculum modules will appear once the instructor publishes them.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Preview lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {previewLessons.length ? previewLessons.map((lesson, index) => (
                <div key={`${lesson.title}-${index}`} className="grid grid-cols-[4rem_1fr] gap-3 rounded-md border border-[hsl(var(--border))] p-2">
                  <div className="relative overflow-hidden rounded-md bg-[hsl(var(--muted))]">
                    <SafeImage
                      src={course.image}
                      fallbackSrc={courseImageForCategory(course.category)}
                      alt={lesson.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold">{lesson.title}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatLessonMinutes(lesson.durationMinutes)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Lessons will appear after the course is synced to MongoDB.</p>
              )}
              <Button asChild className="w-full">
                <Link href={learningHref}>
                  <PlayCircle className="size-4" />
                  {learningLabel}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course files</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {courseResources.length ? courseResources.slice(0, 5).map((resource, index) => (
                <a
                  key={`${resource.url}-${index}`}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  download={resource.downloadable ? "" : undefined}
                  className="rounded-md border border-[hsl(var(--border))] p-3 text-sm font-medium hover:bg-[hsl(var(--muted))]/50"
                >
                  <Download className="mb-2 size-4 text-[hsl(var(--primary))]" />
                  {resourceLabel(resource, index)}
                </a>
              )) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No course downloads are published yet.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
