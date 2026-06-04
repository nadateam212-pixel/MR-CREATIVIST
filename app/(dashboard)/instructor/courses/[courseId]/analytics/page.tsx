import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CourseStudioTools } from "@/components/platform/course-studio-tools";
import connectMongoDB from "@/lib/mongodb";
import { mongoIdOrSlug } from "@/lib/mongo-api";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import LearningProgress from "@/models/LearningProgress";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function getCourseAnalytics(courseId: string, userId?: string) {
  await connectMongoDB();
  const course = await Course.findOne(mongoIdOrSlug(courseId)).lean();
  if (!course) return null;
  if (userId && course.instructorId && String(course.instructorId) !== String(userId)) return null;

  const [enrollments, progressRows] = await Promise.all([
    Enrollment.find({ courseId: course._id }).sort({ updatedAt: -1 }).limit(120).lean(),
    LearningProgress.find({ courseId: course._id }).sort({ lastActivityAt: -1, updatedAt: -1 }).limit(120).lean()
  ]);
  const progressByEmail = new Map(progressRows.map((row) => [String(row.learnerEmail ?? "").toLowerCase(), row]));
  const rows = enrollments.map((enrollment) => {
    const progress = progressByEmail.get(String(enrollment.learnerEmail ?? "").toLowerCase());
    return {
      id: String(progress?._id ?? enrollment._id),
      learnerName: progress?.learnerName ?? enrollment.learnerName,
      learnerEmail: progress?.learnerEmail ?? enrollment.learnerEmail,
      progressPercent: progress?.progressPercent ?? enrollment.progressPercent ?? 0,
      status: progress?.status ?? enrollment.status ?? "active",
      currentLessonKey: progress?.currentLessonKey,
      updatedAt: progress?.updatedAt ?? enrollment.updatedAt,
      lastActivityAt: progress?.lastActivityAt
    };
  });

  return clean({
    course: {
      ...course,
      id: String(course._id),
      modules: course.modules ?? [],
      outcomes: course.outcomes ?? [],
      tools: course.tools ?? []
    },
    rows
  });
}

export default async function CourseAnalyticsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { courseId } = await params;
  const result = await getCourseAnalytics(courseId, session.user.role === "admin" ? undefined : session.user.id);
  if (!result) notFound();

  return <CourseStudioTools mode="analytics" initialCourse={result.course} analyticsRows={result.rows} />;
}
