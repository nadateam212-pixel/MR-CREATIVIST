import type { Metadata } from "next";
import { AdminPeopleManager, type AdminPersonRow } from "@/components/admin/admin-people-manager";
import connectMongoDB from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Instructors"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

type InstructorUserDoc = {
  _id: string;
  name: string;
  email: string;
  accountStatus?: "active" | "review" | "suspended";
};

type CourseDoc = {
  instructorName?: string;
  status?: string;
  enrolledCount?: number;
};

export default async function AdminInstructorsPage() {
  await connectMongoDB();

  const [users, courses] = clean(
    await Promise.all([
      User.find({ $or: [{ role: "instructor" }, { validatedRoles: "instructor" }] })
        .select("name email role accountStatus validatedRoles")
        .sort({ createdAt: -1 })
        .limit(120)
        .lean(),
      Course.find({ status: { $ne: "archived" } }).select("instructorName status enrolledCount").lean()
    ])
  ) as [InstructorUserDoc[], CourseDoc[]];

  const rows: AdminPersonRow[] = users.map((user) => {
    const instructorCourses = courses.filter(
      (course) =>
        String(course.instructorName ?? "").toLowerCase() === user.name.toLowerCase() ||
        String(course.instructorName ?? "").toLowerCase() === user.email.toLowerCase()
    );
    const learnerCount = instructorCourses.reduce((total, course) => total + Number(course.enrolledCount ?? 0), 0);

    return {
      id: String(user._id),
      userId: String(user._id),
      name: user.name,
      email: user.email,
      role: "instructor",
      title: "Validated course instructor",
      status: user.accountStatus ?? "active",
      metric: `${instructorCourses.length} courses, ${learnerCount} learners`,
      href: `/admin/users/${user._id}`,
      publicHref: "/courses"
    };
  });

  return (
    <div className="content-frame space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Instructor control</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">List and manage instructors</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Review instructor accounts, message instructors, block unsafe accounts and jump into their user moderation record.
        </p>
      </div>
      <AdminPeopleManager title="Instructor records" rows={rows} emptyMessage="No instructors are registered yet." />
    </div>
  );
}
