import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CourseStudioTools } from "@/components/platform/course-studio-tools";
import connectMongoDB from "@/lib/mongodb";
import { mongoIdOrSlug } from "@/lib/mongo-api";
import Course from "@/models/Course";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function getCourse(courseId: string, userId?: string) {
  await connectMongoDB();
  const course = await Course.findOne(mongoIdOrSlug(courseId)).lean();
  if (!course) return null;
  if (userId && course.instructorId && String(course.instructorId) !== String(userId)) return null;
  return clean({
    ...course,
    id: String(course._id),
    modules: course.modules ?? [],
    outcomes: course.outcomes ?? [],
    tools: course.tools ?? []
  });
}

export default async function ManageCurriculumPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { courseId } = await params;
  const course = await getCourse(courseId, session.user.role === "admin" ? undefined : session.user.id);
  if (!course) notFound();

  return <CourseStudioTools mode="curriculum" initialCourse={course} />;
}
