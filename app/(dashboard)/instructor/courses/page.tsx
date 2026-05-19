import type { Metadata } from "next";
import { CourseManager } from "@/components/platform/creator-workbenches";
import { getCourses } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Instructor Courses"
};

export default async function InstructorCoursesPage() {
  const courses = await getCourses();

  return <CourseManager initialCourses={courses} />;
}
