import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import { mongoIdOrSlug } from "@/lib/mongo-api";

export async function saveCourseEnrollment({ courseId, enrollment, session }) {
  const course = await Course.findOne(mongoIdOrSlug(courseId)).lean();

  if (!course) {
    return { course: null, enrollment: null, created: false };
  }

  const learnerEmail = String(enrollment.learnerEmail ?? "").trim().toLowerCase();
  const learnerName = String(enrollment.learnerName ?? session?.user?.name ?? "Learner").trim();
  const account = session?.user?.id
    ? await User.findById(session.user.id).select("_id email").lean()
    : await User.findOne({ email: learnerEmail }).select("_id email").lean();

  const existing = await Enrollment.findOne({ courseId: course._id, learnerEmail })
    .select("_id status")
    .lean();
  const created = !existing || existing.status === "cancelled";

  const savedEnrollment = await Enrollment.findOneAndUpdate(
    { courseId: course._id, learnerEmail },
    {
      ...enrollment,
      courseId: course._id,
      userId: account?._id,
      learnerName,
      learnerEmail,
      status: "active"
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  await Promise.all([
    created ? Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } }) : null,
    account
      ? User.findByIdAndUpdate(account._id, {
          $addToSet: { validatedRoles: { $each: ["client", "student"] } }
        })
      : null
  ]);

  return { course, enrollment: savedEnrollment, created };
}

