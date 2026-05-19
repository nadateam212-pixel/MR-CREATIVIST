import type { Metadata } from "next";
import { LearningWorkbench } from "@/components/platform/learning-workbench";
import { getCourses } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "My Courses"
};

export default async function MyCoursesPage() {
  const courses = await getCourses();

  return <LearningWorkbench initialCourses={courses} />;
}
