import type { Metadata } from "next";
import { auth } from "@/auth";
import { CourseManager } from "@/components/platform/creator-workbenches";
import connectMongoDB, { hasMongoConfig } from "@/lib/mongodb";
import { normalizeCourse } from "@/lib/platform-db";
import Course from "@/models/Course";

export const metadata: Metadata = {
  title: "Instructor Courses"
};

async function getStudioCourses() {
  const session = await auth();
  if (!session?.user || !hasMongoConfig()) return [];

  try {
    await connectMongoDB();
    const filter: Record<string, unknown>[] = [];
    if (session.user.id) filter.push({ instructorId: session.user.id });
    if (session.user.name) filter.push({ instructorName: new RegExp(`^${session.user.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });

    if (!filter.length) return [];

    const courses = await Course.find({ $or: filter, status: { $ne: "archived" } }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).lean();

    return courses.map(normalizeCourse);
  } catch {
    return [];
  }
}

export default async function InstructorCoursesPage() {
  const courses = await getStudioCourses();

  return <CourseManager initialCourses={courses} />;
}
