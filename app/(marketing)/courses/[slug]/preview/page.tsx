import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseLearningEntry } from "@/components/platform/course-learning-entry";
import { CourseLearningWorkspace } from "@/components/platform/course-learning-workspace";
import { buildCourseStructure } from "@/lib/learning-engine";
import { connectMongoDB } from "@/lib/mongodb";
import Course from "@/models/Course";

export const metadata: Metadata = { title: "Course Preview" };

export default async function CoursePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectMongoDB();
  const courseDoc = await Course.findOne({ slug, status: { $ne: "archived" } }).lean();
  if (!courseDoc) notFound();

  const course = buildCourseStructure(courseDoc);
  if (!course.totalLessons) {
    return (
      <CourseLearningEntry
        courseId={slug}
        learnerName="Guest learner"
        databaseMessage="This course has no public lessons saved in MongoDB yet. If it was built in this browser, the local Studio curriculum will open after hydration."
      />
    );
  }

  const initialProgress = {
    completedLessonKeys: [],
    currentLessonKey: course.flatLessons[0]?.key ?? "",
    progressPercent: 0,
    status: "preview",
    certificateIssuedAt: null,
    events: [],
    studySecondsByLesson: {},
    studySecondsByModule: {},
    moduleRequiredSeconds: {},
    totalStudySeconds: 0,
    quizAttempts: {}
  };

  return <CourseLearningWorkspace course={course} initialProgress={initialProgress} enrolled={false} learnerName="Guest learner" />;
}
