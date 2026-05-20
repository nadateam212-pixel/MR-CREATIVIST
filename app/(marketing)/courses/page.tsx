import type { Metadata } from "next";
import { CatalogExperience } from "@/components/platform/catalog-experience";
import { getCourses } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Explore MR Creativist free and paid online courses for AI, business, marketplace, freelancing, multimedia, consulting and certificates in Rwanda, Africa and Canada."
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CatalogExperience mode="courses" courses={courses} />;
}
