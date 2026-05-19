import type { Metadata } from "next";
import { auth } from "@/auth";
import { InstructorCourseStudio } from "@/components/platform/creator-workbenches";

export const metadata: Metadata = {
  title: "Create Course"
};

export default async function CreateCoursePage() {
  const session = await auth();

  return <InstructorCourseStudio instructorName={session?.user?.name ?? "MR Creativist Instructor"} />;
}
