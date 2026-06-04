import type { Metadata } from "next";
import { AdminCertificatesConsole, type AdminCertificateRow } from "@/components/admin/admin-certificates-console";
import connectMongoDB from "@/lib/mongodb";
import CertificateCredential from "@/models/CertificateCredential";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certificate Management"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AdminCertificatesPage() {
  await connectMongoDB();

  const [certificates, completedEnrollments] = clean(
    await Promise.all([
      CertificateCredential.find({}).sort({ issuedAt: -1, updatedAt: -1 }).limit(300).lean(),
      Enrollment.find({
        $or: [{ status: "completed" }, { progressPercent: { $gte: 100 } }]
      })
        .sort({ updatedAt: -1 })
        .limit(300)
        .lean()
    ])
  ) as [Record<string, any>[], Record<string, any>[]];

  const courseIds = Array.from(
    new Set([
      ...certificates.map((certificate) => String(certificate.courseId ?? "")).filter(Boolean),
      ...completedEnrollments.map((enrollment) => String(enrollment.courseId ?? "")).filter(Boolean)
    ])
  );
  const courses = clean(
    await Course.find({ _id: { $in: courseIds } }).select("_id title slug instructorName duration").lean()
  ) as Record<string, any>[];
  const courseById = new Map(courses.map((course) => [String(course._id), course]));
  const issuedByLearnerCourse = new Set(certificates.map((certificate) => `${certificate.userEmail}:${certificate.courseSlug}`));

  const issuedRows: AdminCertificateRow[] = certificates.map((certificate) => {
    const course = courseById.get(String(certificate.courseId ?? ""));

    return {
      id: String(certificate._id),
      kind: "issued",
      learnerName: certificate.learnerName,
      userEmail: certificate.userEmail,
      courseTitle: certificate.courseTitle,
      courseSlug: certificate.courseSlug,
      instructor: certificate.metadata?.instructor ?? course?.instructorName,
      verificationCode: certificate.verificationCode,
      status: certificate.status ?? "issued",
      issuedAt: certificate.issuedAt ?? certificate.createdAt,
      progressPercent: 100
    };
  });

  const eligibleRows: AdminCertificateRow[] = completedEnrollments
    .map((enrollment) => {
      const course = courseById.get(String(enrollment.courseId ?? ""));
      const courseSlug = String(course?.slug ?? "");
      if (!courseSlug || issuedByLearnerCourse.has(`${enrollment.learnerEmail}:${courseSlug}`)) return null;

      return {
        id: `eligible:${enrollment._id}`,
        kind: "eligible",
        learnerName: enrollment.learnerName,
        userEmail: enrollment.learnerEmail,
        courseTitle: course?.title ?? "Course not found",
        courseSlug,
        instructor: course?.instructorName,
        status: "eligible" as const,
        enrollmentId: String(enrollment._id),
        progressPercent: Number(enrollment.progressPercent ?? 100)
      };
    })
    .filter(Boolean) as AdminCertificateRow[];

  return <AdminCertificatesConsole initialRows={[...issuedRows, ...eligibleRows]} />;
}
