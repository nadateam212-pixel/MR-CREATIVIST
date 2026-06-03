import type { Metadata } from "next";
import { auth } from "@/auth";
import { EasyCoursePublisher } from "@/components/platform/easy-course-publisher";

export const metadata: Metadata = {
  title: "Create Course"
};

export default async function CreateCoursePage() {
  const session = await auth();

  return <EasyCoursePublisher instructorName={session?.user?.name ?? "MR Creativist Instructor"} />;
}
