"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, CheckCircle2, Copy, Eye, FileText, PlayCircle, Plus, Save, Send, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { courseCategories } from "@/lib/course-categories";
import { normalizedExternalVideoUrl } from "@/lib/video-sources";
import { buildStudioCoursePayload } from "@/lib/course-studio-sync";
import { usePlatformStore } from "@/hooks/use-platform-store";

type Lesson = {
  title: string;
  type?: string;
  sourceType?: string;
  durationMinutes?: number;
  durationSeconds?: number;
  summary?: string;
  videoUrl?: string;
  videoProvider?: string;
  imageUrl?: string;
  resources?: { label?: string; title?: string; url?: string; type?: string; downloadable?: boolean }[];
  isPreview?: boolean;
  freePreview?: boolean;
  previewStartSeconds?: number;
  previewEndSeconds?: number;
};

type Module = {
  title: string;
  description?: string;
  orderIndex?: number;
  status?: string;
  lessons?: Lesson[];
};

type CourseRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  level: string;
  language?: string;
  price: number;
  compareAtPrice?: number;
  currency: "USD" | "FRW";
  image: string;
  trailerUrl?: string;
  instructorName: string;
  status: string;
  lessonsCount: number;
  enrolledCount: number;
  rating: number;
  modules: Module[];
  outcomes: string[];
  tools: string[];
};

type AnalyticsRow = {
  id: string;
  learnerName?: string;
  learnerEmail?: string;
  progressPercent?: number;
  status?: string;
  currentLessonKey?: string;
  updatedAt?: string;
  lastActivityAt?: string;
};

function formatDate(value?: string) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["published", "approved", "completed", "active"].includes(normalized)) return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  if (["submitted", "draft", "changes_requested"].includes(normalized)) return "border-amber-500/40 text-amber-600";
  return "";
}

function lessonCount(modules: Module[]) {
  return modules.reduce((total, module) => total + (module.lessons?.length ?? 0), 0);
}

function defaultLesson(moduleTitle: string): Lesson {
  return {
    title: `${moduleTitle} lesson`,
    type: "article",
    sourceType: "text",
    durationMinutes: 10,
    durationSeconds: 600,
    summary: "Instructor lesson content is ready for learners.",
    resources: [],
    isPreview: false,
    freePreview: false,
    previewStartSeconds: 0,
    previewEndSeconds: 90
  };
}

export function CourseStudioTools({
  mode,
  initialCourse,
  analyticsRows = []
}: {
  mode: "edit" | "curriculum" | "analytics";
  initialCourse: CourseRecord;
  analyticsRows?: AnalyticsRow[];
}) {
  const [course, setCourse] = useState(initialCourse);
  const [saving, setSaving] = useState("");
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const courseChapters = usePlatformStore((state) => state.courseChapters);
  const courseLessons = usePlatformStore((state) => state.courseLessons);
  const courseAssets = usePlatformStore((state) => state.courseAssets);
  const courseQuizzes = usePlatformStore((state) => state.courseQuizzes);
  const localCourse = useMemo(
    () => createdCourses.find((item) => item.slug === course.slug || item.slug === initialCourse.slug),
    [course.slug, createdCourses, initialCourse.slug]
  );
  const localChapters = useMemo(
    () => (localCourse ? courseChapters[localCourse.slug] ?? [] : []),
    [courseChapters, localCourse]
  );
  const localLessons = useMemo(
    () => (localCourse ? courseLessons[localCourse.slug] ?? [] : []),
    [courseLessons, localCourse]
  );
  const localAssets = useMemo(
    () => (localCourse ? courseAssets.filter((asset) => asset.courseSlug === localCourse.slug) : []),
    [courseAssets, localCourse]
  );
  const localQuizzes = useMemo(
    () => (localCourse ? courseQuizzes.filter((quiz) => quiz.courseSlug === localCourse.slug) : []),
    [courseQuizzes, localCourse]
  );
  const [lessonForm, setLessonForm] = useState({
    moduleIndex: "0",
    title: "New lesson",
    type: "video",
    videoUrl: "",
    durationMinutes: "10",
    summary: ""
  });
  const [editForm, setEditForm] = useState({
    title: initialCourse.title,
    shortDescription: initialCourse.shortDescription,
    description: initialCourse.description,
    category: initialCourse.category,
    level: initialCourse.level,
    price: String(initialCourse.price ?? 0),
    compareAtPrice: String(initialCourse.compareAtPrice ?? ""),
    currency: initialCourse.currency,
    trailerUrl: initialCourse.trailerUrl ?? "",
    image: initialCourse.image,
    status: initialCourse.status
  });
  const totalLessons = lessonCount(course.modules);
  const completedRows = analyticsRows.filter((row) => Number(row.progressPercent ?? 0) >= 100).length;
  const avgProgress = analyticsRows.length
    ? Math.round(analyticsRows.reduce((total, row) => total + Number(row.progressPercent ?? 0), 0) / analyticsRows.length)
    : 0;

  const moduleOptions = useMemo(
    () => course.modules.map((module, index) => ({ label: module.title || `Module ${index + 1}`, value: String(index) })),
    [course.modules]
  );
  const localRecoveryPayload = useMemo(
    () =>
      localCourse
        ? buildStudioCoursePayload({
            course: localCourse,
            chapters: localChapters,
            lessons: localLessons,
            assets: localAssets,
            quizzes: localQuizzes,
            status: course.status
          })
        : null,
    [course.status, localAssets, localChapters, localCourse, localLessons, localQuizzes]
  );

  const updateCourse = useCallback(async (patch: Partial<CourseRecord>, successMessage = "Course saved.") => {
    setSaving("course");
    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.id || course.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Course update failed.");

      setCourse((current) => ({
        ...current,
        ...payload,
        id: String(payload.id ?? payload._id ?? current.id),
        price: Number(payload.price ?? current.price),
        modules: payload.modules ?? current.modules,
        outcomes: payload.outcomes ?? current.outcomes,
        tools: payload.tools ?? current.tools
      }));
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Course update failed.");
    } finally {
      setSaving("");
    }
  }, [course.id, course.slug]);

  useEffect(() => {
    if (course.modules.length || !localRecoveryPayload?.lessonsCount || saving) return;

    const timer = window.setTimeout(() => {
      void updateCourse(localRecoveryPayload as Partial<CourseRecord>, "Studio lessons recovered and saved to MongoDB.");
    }, 600);

    return () => window.clearTimeout(timer);
  }, [course.modules.length, localRecoveryPayload, saving, updateCourse]);

  function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void updateCourse({
      ...editForm,
      price: Number(editForm.price) || 0,
      compareAtPrice: editForm.compareAtPrice ? Number(editForm.compareAtPrice) || 0 : undefined,
      currency: editForm.currency as "USD" | "FRW"
    } as Partial<CourseRecord>, "Course metadata saved.");
  }

  function addModule() {
    const nextModules = [
      ...course.modules,
      {
        title: `Module ${course.modules.length + 1}`,
        description: "Lessons, resources, and completion checks.",
        orderIndex: course.modules.length,
        status: "ready",
        lessons: []
      }
    ];
    void updateCourse({ modules: nextModules, lessonsCount: lessonCount(nextModules) } as Partial<CourseRecord>, "Module saved.");
  }

  function addLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const moduleIndex = Number(lessonForm.moduleIndex) || 0;
    const modules = course.modules.length ? course.modules : [{ title: "Getting Started", status: "ready", lessons: [] }];
    const target = modules[moduleIndex] ?? modules[0];
    const videoUrl = lessonForm.videoUrl.trim();
    const normalized = normalizedExternalVideoUrl(videoUrl);
    const nextLesson: Lesson = {
      ...defaultLesson(target.title),
      title: lessonForm.title.trim() || "New lesson",
      type: videoUrl ? "video" : lessonForm.type,
      sourceType: videoUrl ? "google-drive" : "text",
      durationMinutes: Number(lessonForm.durationMinutes) || 10,
      durationSeconds: (Number(lessonForm.durationMinutes) || 10) * 60,
      summary: lessonForm.summary.trim() || "Complete this lesson to continue the course.",
      videoUrl: videoUrl || undefined,
      videoProvider: videoUrl ? normalized.provider : undefined,
      isPreview: totalLessons === 0,
      freePreview: totalLessons === 0
    };
    const nextModules = modules.map((module, index) =>
      index === moduleIndex ? { ...module, status: "ready", lessons: [...(module.lessons ?? []), nextLesson] } : module
    );

    void updateCourse({ modules: nextModules, lessonsCount: lessonCount(nextModules) } as Partial<CourseRecord>, "Lesson saved.");
    setLessonForm((current) => ({ ...current, title: "New lesson", videoUrl: "", summary: "" }));
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    const nextModules = course.modules.map((module, index) =>
      index === moduleIndex ? { ...module, lessons: (module.lessons ?? []).filter((_, innerIndex) => innerIndex !== lessonIndex) } : module
    );
    void updateCourse({ modules: nextModules, lessonsCount: lessonCount(nextModules) } as Partial<CourseRecord>, "Lesson removed.");
  }

  function copyCourseLink() {
    void navigator.clipboard?.writeText(`${window.location.origin}/courses/${course.slug}`);
    toast.success("Course link copied.");
  }

  return (
    <div className="content-frame space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge className={statusTone(course.status)}>{course.status.replaceAll("_", " ")}</Badge>
            <Badge>{totalLessons} lessons</Badge>
            <Badge>{course.category}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{course.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{course.shortDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/courses/${course.slug}`}>
              <Eye className="size-4" />
              Public view
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/learning/${course.slug}`}>
              <PlayCircle className="size-4" />
              Player
            </Link>
          </Button>
          <Button variant="outline" onClick={copyCourseLink}>
            <Copy className="size-4" />
            Share
          </Button>
          <Button variant="outline" onClick={() => void updateCourse({ status: "submitted" } as Partial<CourseRecord>, "Review sent successfully.")} disabled={saving === "course"}>
            <Send className="size-4" />
            Send review
          </Button>
          <Button onClick={() => void updateCourse({ status: "published" } as Partial<CourseRecord>, "Course published successfully.")} disabled={saving === "course"}>
            <Send className="size-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Modules", value: course.modules.length, icon: BookOpen },
          { label: "Lessons", value: totalLessons, icon: Video },
          { label: "Learners", value: analyticsRows.length || course.enrolledCount || 0, icon: BarChart3 },
          { label: "Average progress", value: `${avgProgress}%`, icon: CheckCircle2 }
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <metric.icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-1 text-2xl font-black">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {mode === "edit" ? (
        <Card>
          <CardHeader>
            <CardTitle>Course metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={saveMetadata}>
              <label className="grid gap-2 text-sm font-semibold">
                Title
                <Input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Category
                <select value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  {Array.from(new Set([editForm.category, ...courseCategories].filter(Boolean))).map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Level
                <select value={editForm.level} onChange={(event) => setEditForm((current) => ({ ...current, level: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  {["Beginner", "Intermediate", "Advanced", "All levels", "Expert"].map((level) => <option key={level}>{level}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Status
                <select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  {["draft", "submitted", "changes_requested", "approved", "published", "unlisted", "archived"].map((status) => <option key={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Short description
                <Input value={editForm.shortDescription} onChange={(event) => setEditForm((current) => ({ ...current, shortDescription: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Full description
                <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} className="min-h-36 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Price
                <Input value={editForm.price} onChange={(event) => setEditForm((current) => ({ ...current, price: event.target.value }))} inputMode="decimal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Compare price
                <Input value={editForm.compareAtPrice} onChange={(event) => setEditForm((current) => ({ ...current, compareAtPrice: event.target.value }))} inputMode="decimal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Trailer or first lesson video URL
                <Input value={editForm.trailerUrl} onChange={(event) => setEditForm((current) => ({ ...current, trailerUrl: event.target.value }))} placeholder="YouTube, Vimeo, Google Drive, or hosted MP4" />
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={saving === "course"}>
                  <Save className="size-4" />
                  Save course
                </Button>
                <Button type="button" variant="outline" onClick={() => void updateCourse({ status: "archived" } as Partial<CourseRecord>, "Course archived.")}>
                  <Trash2 className="size-4" />
                  Archive
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {mode === "curriculum" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Published curriculum</CardTitle>
              <Button onClick={addModule} variant="outline">
                <Plus className="size-4" />
                Module
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {course.modules.length ? course.modules.map((module, moduleIndex) => (
                <div key={`${module.title}-${moduleIndex}`} className="rounded-md border border-[hsl(var(--border))] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Badge>Module {moduleIndex + 1}</Badge>
                      <h2 className="mt-2 text-lg font-black">{module.title}</h2>
                      {module.description ? <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{module.description}</p> : null}
                    </div>
                    <Badge>{module.lessons?.length ?? 0} lessons</Badge>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {(module.lessons ?? []).map((lesson, lessonIndex) => (
                      <div key={`${moduleIndex}-${lessonIndex}-${lesson.title}`} className="flex flex-col gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{lesson.title}</p>
                          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                            {lesson.type ?? "article"} - {lesson.durationMinutes ?? 0} min {lesson.videoUrl ? "- video attached" : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {lesson.videoUrl ? (
                            <Button asChild size="sm" variant="outline">
                              <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                                <Eye className="size-4" />
                                Preview
                              </a>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => removeLesson(moduleIndex, lessonIndex)}>
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!module.lessons?.length ? <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-3 text-sm text-[hsl(var(--muted-foreground))]">No lessons yet. Add the first lesson from the panel.</p> : null}
                  </div>
                </div>
              )) : (
                <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No modules are saved yet. Add a module, then add lessons with video or article content.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="h-max">
            <CardHeader>
              <CardTitle>Add lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={addLesson}>
                <select value={lessonForm.moduleIndex} onChange={(event) => setLessonForm((current) => ({ ...current, moduleIndex: event.target.value }))} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3">
                  {(moduleOptions.length ? moduleOptions : [{ value: "0", label: "Getting Started" }]).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <Input value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} placeholder="Lesson title" />
                <Input value={lessonForm.videoUrl} onChange={(event) => setLessonForm((current) => ({ ...current, videoUrl: event.target.value }))} placeholder="Video URL (optional)" />
                <Input value={lessonForm.durationMinutes} onChange={(event) => setLessonForm((current) => ({ ...current, durationMinutes: event.target.value }))} inputMode="numeric" placeholder="Minutes" />
                <textarea value={lessonForm.summary} onChange={(event) => setLessonForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-24 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 text-sm" placeholder="Lesson summary" />
                <Button type="submit" disabled={saving === "course"}>
                  <Plus className="size-4" />
                  Add lesson
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {mode === "analytics" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
          <Card>
            <CardHeader>
              <CardTitle>Learner progress</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="p-4 font-medium">Learner</th>
                    <th className="p-4 font-medium">Progress</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {analyticsRows.length ? analyticsRows.map((row) => (
                    <tr key={row.id}>
                      <td className="p-4">
                        <p className="font-semibold">{row.learnerName ?? "Learner"}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{row.learnerEmail}</p>
                      </td>
                      <td className="p-4">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                          <div className="h-full bg-[hsl(var(--primary))]" style={{ width: `${Math.min(100, Number(row.progressPercent ?? 0))}%` }} />
                        </div>
                        <p className="mt-1 text-xs font-semibold">{Number(row.progressPercent ?? 0)}%</p>
                      </td>
                      <td className="p-4"><Badge className={statusTone(row.status ?? "active")}>{row.status ?? "active"}</Badge></td>
                      <td className="p-4 text-[hsl(var(--muted-foreground))]">{formatDate(row.lastActivityAt ?? row.updatedAt)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No learners have opened this course yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card className="h-max">
            <CardHeader>
              <CardTitle>Course health</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-md border border-[hsl(var(--border))] p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Completions</p>
                <p className="mt-1 text-2xl font-black">{completedRows}</p>
              </div>
              <div className="rounded-md border border-[hsl(var(--border))] p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Price</p>
                <PriceDisplay price={`${course.currency} ${course.price}`} className="mt-1 text-2xl text-[hsl(var(--primary))]" />
              </div>
              <div className="rounded-md border border-[hsl(var(--border))] p-4">
                <FileText className="mb-2 size-5 text-[hsl(var(--primary))]" />
                <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  Analytics are loaded from enrollments and learning progress stored in MongoDB.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
