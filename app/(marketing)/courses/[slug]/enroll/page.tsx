import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CourseEnrollmentPanel } from "@/components/platform/course-enrollment-panel";
import { getCourseBySlug } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Course Enrollment"
};

export default async function CourseEnrollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  return (
    <PageShell eyebrow="Enrollment" title="Course enrollment" description="Pay, enroll, unlock lessons, track progress, pass tests, and generate certificates.">
      <CourseEnrollmentPanel slug={slug} course={course} />
    </PageShell>
  );
}
