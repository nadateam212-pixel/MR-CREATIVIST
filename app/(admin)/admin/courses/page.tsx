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

export default async function AdminCoursesPage() {
  await connectMongoDB();

  const courses = clean(
    (await Course.find({}).sort({ isFeatured: -1, enrolledCount: -1, rating: -1, updatedAt: -1 }).limit(120).lean()).map(normalizeCourse)
  );

  const rows: AdminContentRow[] = courses.map((course: ReturnType<typeof normalizeCourse>) => ({
    id: String(course.id ?? course.slug),
    title: course.title,
    subtitle: `${course.category ?? "Course"} - ${course.instructor ?? "Instructor"} - ${course.learners ?? 0} learners`,
    kind: course.level ?? "course",
    status: course.status ?? "draft",
    href: course.slug ? `/courses/${course.slug}` : "/courses",
    apiPath: `/api/courses/${course.id ?? course.slug}`,
    updateMethod: "PUT",
    editFields: [
      { key: "title", label: "Course title", value: course.title },
      { key: "category", label: "Category", value: course.category ?? "" },
      { key: "status", label: "Status", value: course.status ?? "draft", options: ["draft", "published", "archived"] }
    ]
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Course moderation</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">List and approve courses</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Review curricula, publish qualified courses, edit public metadata, share course links and archive courses that need removal.
        </p>
      </div>
      <AdminContentTable title="Course records" rows={rows} emptyMessage="No courses have been created yet." />
    </div>
  );
}
