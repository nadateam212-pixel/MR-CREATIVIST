import type { Metadata } from "next";
import { AdminContentTable, type AdminContentRow } from "@/components/admin/admin-content-table";
import connectMongoDB from "@/lib/mongodb";
import { normalizeCourse } from "@/lib/platform-db";
import Course from "@/models/Course";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Courses"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

type CourseLessonPreview = {
  title?: string;
  type?: string;
  videoUrl?: string;
  video?: { url?: string };
  embedUrl?: string;
};

type CourseModulePreview = {
  title?: string;
  lessons?: CourseLessonPreview[];
};

function coursePreviewDetails(course: ReturnType<typeof normalizeCourse>) {
  const modules = Array.isArray(course.modules) ? (course.modules as CourseModulePreview[]) : [];
  const lessons = modules.flatMap((module) =>
    Array.isArray(module.lessons)
      ? module.lessons.map((lesson) => ({
          moduleTitle: module.title,
          title: lesson.title,
          type: lesson.type,
          videoUrl: lesson.videoUrl || lesson.video?.url || lesson.embedUrl
        }))
      : []
  );
  const videoLessons = lessons.filter((lesson) => lesson.videoUrl).length;

  return {
    modules: String(modules.length),
    lessons: String(lessons.length),
    videoLessons: String(videoLessons),
    previewLessons: lessons.length
      ? lessons
          .slice(0, 8)
          .map((lesson, index) => `${index + 1}. ${lesson.moduleTitle ? `${lesson.moduleTitle}: ` : ""}${lesson.title ?? "Untitled lesson"}${lesson.videoUrl ? " (video)" : ""}`)
          .join("\n")
      : "No lessons saved yet",
    publicLink: course.slug ? `/courses/${course.slug}` : "Not published"
  };
}

export default async function AdminCoursesPage() {
  await connectMongoDB();

  const courses = clean(
    (await Course.find({}).sort({ isFeatured: -1, enrolledCount: -1, rating: -1, updatedAt: -1 }).limit(120).lean()).map(normalizeCourse)
  );

  const rows: AdminContentRow[] = courses.map((course: ReturnType<typeof normalizeCourse>) => ({
    id: String(course.id ?? course.slug),
    title: course.title,
    subtitle: `${course.category ?? "Course"} - ${course.instructor ?? "Instructor"} - ${course.learners ?? 0} learners`,
    image: course.image,
    kind: course.level ?? "course",
    status: course.status ?? "draft",
    isVerified: Boolean(course.status === "approved" || course.status === "published"),
    href: course.slug ? `/courses/${course.slug}` : "/courses",
    apiPath: `/api/courses/${course.id ?? course.slug}`,
    updateMethod: "PUT",
    statusActions: [
      { label: "Approve", status: "approved" },
      { label: "Publish", status: "published" },
      { label: "Request changes", status: "changes_requested" }
    ],
    editFields: [
      { key: "title", label: "Course title", value: course.title },
      { key: "category", label: "Category", value: course.category ?? "" },
      {
        key: "status",
        label: "Status",
        value: course.status ?? "draft",
        options: ["draft", "submitted", "changes_requested", "approved", "published", "unlisted", "archived"]
      }
    ],
    details: coursePreviewDetails(course)
  }));

  return (
    <div className="content-frame space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Course moderation</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Courses</h1>
      </div>
      <AdminContentTable title="Course records" rows={rows} emptyMessage="No courses have been created yet." />
    </div>
  );
}
