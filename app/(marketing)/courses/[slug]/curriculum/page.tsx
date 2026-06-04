import { CourseDetailExperience } from "@/components/platform/course-detail-experience";
import { getCourseBySlug } from "@/lib/platform-db";

export default async function CourseCurriculumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  return <CourseDetailExperience slug={slug} initialCourse={course} />;
}
