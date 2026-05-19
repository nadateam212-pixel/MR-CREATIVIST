"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, BookOpen, Brain, CheckCircle2, FileCheck2, Lock, Play, Sparkles, Unlock, Upload, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { courseImageForCategory } from "@/lib/course-media";
import { type CourseChapterDraft, usePlatformStore } from "@/hooks/use-platform-store";

type CourseCatalogItem = {
  title: string;
  slug: string;
  level: string;
  category: string;
  price: string;
  rating: number;
  learners: number;
  duration: string;
  lessons: number;
  progress: number;
  instructor: string;
  certificate: string;
  image: string;
  outcomes: string[];
  chapters: string[];
  tools: string[];
  status?: string;
};

export function LearningWorkbench({ initialCourses = [] }: { initialCourses?: CourseCatalogItem[] }) {
  const [quizCourseSlug, setQuizCourseSlug] = useState(initialCourses[0]?.slug ?? "");
  const enrolledCourseSlugs = usePlatformStore((state) => state.enrolledCourseSlugs);
  const courseProgress = usePlatformStore((state) => state.courseProgress);
  const certificates = usePlatformStore((state) => state.certificates);
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const courseChapters = usePlatformStore((state) => state.courseChapters);
  const completedChapters = usePlatformStore((state) => state.completedChapters);
  const courseScores = usePlatformStore((state) => state.courseScores);
  const enrollCourse = usePlatformStore((state) => state.enrollCourse);

  const courseCatalog = useMemo(
    () => [...initialCourses, ...createdCourses.filter((course) => course.status === "published")],
    [createdCourses, initialCourses]
  );
  const enrolledCourses = useMemo(
    () => courseCatalog.filter((course) => enrolledCourseSlugs.includes(course.slug)),
    [courseCatalog, enrolledCourseSlugs]
  );
  const selectedCourse = courseCatalog.find((course) => course.slug === quizCourseSlug) ?? courseCatalog[0];
  const availableCourses = enrolledCourses.length > 0 ? enrolledCourses : courseCatalog.slice(0, 3);
  const getChapters = (course: (typeof courseCatalog)[number]): CourseChapterDraft[] =>
    courseChapters[course.slug] ??
    course.chapters.map((chapter, index) => ({
      id: `${course.slug}-${index + 1}`,
      courseSlug: course.slug,
      title: chapter,
      description: `${chapter} lessons, resources, quiz checks, and completion tracking.`,
      order: index + 1,
      estimatedMinutes: 35 + index * 10,
      requiredScore: Math.min(85, index * 20),
      isLocked: index > 0
    }));

  async function enrollInCourse(courseSlug: string) {
    enrollCourse(courseSlug);

    try {
      await fetch(`/api/courses/${encodeURIComponent(courseSlug)}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
    } catch {
      // Local enrollment stays available if the network is temporarily unavailable.
    }
  }

  if (courseCatalog.length === 0 || !selectedCourse) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="mx-auto mb-4 size-8 text-[hsl(var(--primary))]" />
          <h2 className="text-xl font-semibold">No courses yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
            Publish a course to populate the learning workbench.
          </p>
          <Button asChild className="mt-5">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const averageProgress =
    availableCourses.length > 0
      ? Math.round(
          availableCourses.reduce((total, course) => total + (courseProgress[course.slug] ?? course.progress), 0) /
            availableCourses.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "Enrolled courses", value: enrolledCourses.length, icon: BookOpen },
          { label: "Average progress", value: `${averageProgress}%`, icon: Play },
          { label: "Certificates", value: certificates.length, icon: Award },
          { label: "Pending tests", value: 3, icon: FileCheck2 }
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <metric.icon className="mb-4 size-5 text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-1 text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Learning path</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {availableCourses.map((course) => {
              const chapters = getChapters(course);
              const completed = completedChapters[course.slug] ?? [];
              const progress = chapters.length > 0 ? Math.round((completed.length / chapters.length) * 100) : courseProgress[course.slug] ?? course.progress;
              const score = courseScores[course.slug] ?? Math.max(60, progress);
              const certified = certificates.some((certificate) => certificate.courseSlug === course.slug);

              return (
                <div key={course.slug} className="grid gap-4 rounded-lg border border-[hsl(var(--border))] p-4 md:grid-cols-[11rem_1fr]">
                  <div className="relative aspect-video overflow-hidden rounded-md md:aspect-square">
                    <SafeImage
                      src={course.image}
                      fallbackSrc={courseImageForCategory(course.category)}
                      alt={course.title}
                      fill
                      sizes="176px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{course.level}</Badge>
                          <Badge>{course.certificate}</Badge>
                        </div>
                        <h2 className="mt-3 text-xl font-semibold">{course.title}</h2>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                          {course.lessons} lessons by {course.instructor}
                        </p>
                      </div>
                      <p className="text-2xl font-semibold text-[hsl(var(--primary))]">{progress}%</p>
                    </div>
                    <Progress value={progress} className="mt-4" />
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {chapters.map((chapter, index) => {
                        const done = completed.includes(chapter.id);
                        const previousDone = index === 0 || completed.includes(chapters[index - 1]?.id);
                        const unlocked = !chapter.isLocked || (previousDone && score >= chapter.requiredScore);

                        return (
                          <Link
                            key={chapter.id}
                            href={`/dashboard/learning/${course.slug}`}
                            className="rounded-md border border-[hsl(var(--border))] p-3 text-sm transition hover:bg-[hsl(var(--muted))]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{chapter.title}</span>
                              {done ? (
                                <CheckCircle2 className="size-4 text-[hsl(var(--primary))]" />
                              ) : unlocked ? (
                                <Unlock className="size-4 text-[hsl(var(--primary))]" />
                              ) : (
                                <Lock className="size-4 text-[hsl(var(--muted-foreground))]" />
                              )}
                            </div>
                            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                              Needs {chapter.requiredScore}% score - {chapter.estimatedMinutes} min
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href={`/dashboard/learning/${course.slug}`}>
                          <Play className="size-4" />
                          Continue
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/dashboard/learning/${course.slug}`}>
                          <FileCheck2 className="size-4" />
                          Take quiz
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={() => setQuizCourseSlug(course.slug)}>
                        <Brain className="size-4" />
                        Generate quiz
                      </Button>
                      {progress >= 90 ? (
                        <Button asChild variant="outline">
                          <Link href={`/dashboard/learning/${course.slug}`}>
                            {certified ? <CheckCircle2 className="size-4" /> : <Award className="size-4" />}
                            {certified ? "Certified" : "Finish certificate"}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>Auto quiz lab</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={quizCourseSlug}
                onChange={(event) => setQuizCourseSlug(event.target.value)}
                className="h-10 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
              >
                {courseCatalog.map((course) => (
                  <option key={course.slug} value={course.slug}>
                    {course.title}
                  </option>
                ))}
              </select>
              <div className="space-y-3">
                {selectedCourse.outcomes.map((outcome, index) => (
                  <div key={outcome} className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
                    <p className="font-medium">Question {index + 1}</p>
                    <p className="mt-1 text-[hsl(var(--muted-foreground))]">Which action best proves: {outcome.toLowerCase()}?</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload center</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { label: "Video uploads", icon: Video },
                { label: "Book and PDF uploads", icon: Upload },
                { label: "Assignment files", icon: FileCheck2 }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] p-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <item.icon className="size-4 text-[hsl(var(--primary))]" />
                    {item.label}
                  </span>
                  <Badge>Ready</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recommended next courses</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {courseCatalog
            .filter((course) => !enrolledCourseSlugs.includes(course.slug))
            .slice(0, 3)
            .map((course) => (
              <div key={course.slug} className="rounded-lg border border-[hsl(var(--border))] p-4">
                <Badge>{course.category}</Badge>
                <h3 className="mt-3 font-semibold">{course.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <PriceDisplay price={course.price} className="text-sm font-medium" />
                  <span>- {course.duration}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => void enrollInCourse(course.slug)}>
                    Enroll
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/courses/${course.slug}`}>Preview</Link>
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
