import type { Metadata } from "next";
import { CatalogExperience } from "@/components/platform/catalog-experience";
import { getCourses } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Courses"
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CatalogExperience mode="courses" courses={courses} />;
}
