import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CourseLearningEntry } from "@/components/platform/course-learning-entry";
import { CourseLearningWorkspace } from "@/components/platform/course-learning-workspace";
import { getCourseLearningSnapshot } from "@/lib/learning-engine";

export default async function CoursePlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { courseId } = await params;
  const snapshot = await getCourseLearningSnapshot(courseId, session.user);

  if (!snapshot) {
    return (
      <CourseLearningEntry
        courseId={courseId}
        learnerName={session.user.name ?? "MR Creativist Learner"}
        databaseMessage="This course was not found yet. If it was created in this browser, the local course workspace will open after hydration."
      />
    );
  }

  const { course, progress } = snapshot;

  if (snapshot.databaseError || !course || !progress) {
    return (
      <CourseLearningEntry
        courseId={courseId}
        learnerName={session.user.name ?? "MR Creativist Learner"}
        databaseMessage={snapshot.databaseError ?? "Learning workspace could not load."}
      />
    );
  }

  return (
    <CourseLearningWorkspace
      course={course}
      initialProgress={progress as unknown as Parameters<typeof CourseLearningWorkspace>[0]["initialProgress"]}
      learnerName={session.user.name ?? "MR Creativist Learner"}
    />
  );
}
