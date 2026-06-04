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

type CertificateRecord = {
  _id: unknown;
  courseId?: unknown;
  learnerName?: string;
  userEmail?: string;
  courseTitle?: string;
  courseSlug?: string;
  metadata?: { instructor?: string };
  verificationCode?: string;
  status?: string;
  issuedAt?: string;
  createdAt?: string;
};

type EnrollmentRecord = {
  _id: unknown;
  courseId?: unknown;
  learnerName?: string;
  learnerEmail?: string;
  progressPercent?: number;
};

type CourseRecord = {
  _id: unknown;
  title?: string;
  slug?: string;
  instructorName?: string;
};

function certificateStatus(value?: string): AdminCertificateRow["status"] {
  return value === "revoked" ? "revoked" : "issued";
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
  ) as [CertificateRecord[], EnrollmentRecord[]];

  const courseIds = Array.from(
    new Set([
      ...certificates.map((certificate) => String(certificate.courseId ?? "")).filter(Boolean),
      ...completedEnrollments.map((enrollment) => String(enrollment.courseId ?? "")).filter(Boolean)
    ])
  );
  const courses = clean(
    await Course.find({ _id: { $in: courseIds } }).select("_id title slug instructorName duration").lean()
  ) as CourseRecord[];
  const courseById = new Map(courses.map((course) => [String(course._id), course]));
  const issuedByLearnerCourse = new Set(certificates.map((certificate) => `${certificate.userEmail}:${certificate.courseSlug}`));

  const issuedRows: AdminCertificateRow[] = certificates.map((certificate) => {
    const course = courseById.get(String(certificate.courseId ?? ""));

    return {
      id: String(certificate._id),
      kind: "issued",
      learnerName: certificate.learnerName ?? "Unknown learner",
      userEmail: certificate.userEmail ?? "unknown@example.com",
      courseTitle: certificate.courseTitle ?? course?.title ?? "Untitled course",
      courseSlug: certificate.courseSlug ?? course?.slug ?? "",
      instructor: certificate.metadata?.instructor ?? course?.instructorName ?? "MR Creativist Instructor",
      verificationCode: certificate.verificationCode,
      status: certificateStatus(certificate.status),
      issuedAt: certificate.issuedAt ?? certificate.createdAt,
      progressPercent: 100
    };
  });

  const eligibleRows: AdminCertificateRow[] = completedEnrollments
    .map((enrollment) => {
      const course = courseById.get(String(enrollment.courseId ?? ""));
      const courseSlug = String(course?.slug ?? "");
      const learnerEmail = enrollment.learnerEmail ?? "";
      if (!courseSlug || !learnerEmail || issuedByLearnerCourse.has(`${learnerEmail}:${courseSlug}`)) return null;

      return {
        id: `eligible:${enrollment._id}`,
        kind: "eligible",
        learnerName: enrollment.learnerName ?? "Unknown learner",
        userEmail: learnerEmail,
        courseTitle: course?.title ?? "Course not found",
        courseSlug,
        instructor: course?.instructorName ?? "MR Creativist Instructor",
        status: "eligible" as const,
        enrollmentId: String(enrollment._id),
        progressPercent: Number(enrollment.progressPercent ?? 100)
      };
    })
    .filter(Boolean) as AdminCertificateRow[];

  return <AdminCertificatesConsole initialRows={[...issuedRows, ...eligibleRows]} />;
}
