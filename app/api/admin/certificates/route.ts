import mongoose from "mongoose";
import { auth } from "@/auth";
import connectMongoDB from "@/lib/mongodb";
import CertificateCredential from "@/models/CertificateCredential";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

function certificateCode(courseSlug: string) {
  const stem = String(courseSlug || "mrc").replace(/[^a-z0-9]+/gi, "").slice(0, 4).toUpperCase() || "MRC";
  return `MRC-${stem}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "admin") return Response.json({ error: "Admin access required." }, { status: 403 });
  return null;
}

async function uniqueCertificateCode(courseSlug: string) {
  let code = certificateCode(courseSlug);

  while (await CertificateCredential.exists({ verificationCode: code })) {
    code = certificateCode(courseSlug);
  }

  return code;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await connectMongoDB();
    const body = (await request.json()) as { enrollmentId?: string };
    if (!body.enrollmentId || !mongoose.Types.ObjectId.isValid(body.enrollmentId)) {
      return Response.json({ error: "Enrollment id is required." }, { status: 422 });
    }

    const enrollment = await Enrollment.findById(body.enrollmentId).lean();
    if (!enrollment) return Response.json({ error: "Enrollment not found." }, { status: 404 });
    if (enrollment.status !== "completed" && Number(enrollment.progressPercent ?? 0) < 100) {
      return Response.json({ error: "Enrollment is not complete yet." }, { status: 422 });
    }

    const course = await Course.findById(enrollment.courseId).select("_id slug title instructorName duration").lean();
    if (!course) return Response.json({ error: "Course not found." }, { status: 404 });

    const certificate = await CertificateCredential.findOneAndUpdate(
      { userEmail: enrollment.learnerEmail, courseSlug: course.slug },
      {
        $setOnInsert: {
          userId: enrollment.userId,
          userEmail: enrollment.learnerEmail,
          learnerName: enrollment.learnerName,
          courseId: course._id,
          courseSlug: course.slug,
          courseTitle: course.title,
          verificationCode: await uniqueCertificateCode(course.slug),
          template: "Professional",
          issuedAt: new Date(),
          metadata: { source: "admin", instructor: course.instructorName, enrollmentId: String(enrollment._id) }
        },
        $set: { status: "issued" }
      },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    await Enrollment.findByIdAndUpdate(enrollment._id, { certificateIssuedAt: new Date(), status: "completed", progressPercent: 100 });

    return Response.json({ certificate: { ...certificate, id: String(certificate._id) }, message: "Certificate issued." }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Certificate issue failed." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await connectMongoDB();
    const body = (await request.json()) as { certificateId?: string; action?: "revoke" | "restore" | "delete" };
    if (!body.certificateId || !mongoose.Types.ObjectId.isValid(body.certificateId)) {
      return Response.json({ error: "Certificate id is required." }, { status: 422 });
    }

    if (body.action === "delete") {
      await CertificateCredential.findByIdAndDelete(body.certificateId);
      return Response.json({ ok: true, deleted: true });
    }

    const status = body.action === "restore" ? "issued" : "revoked";
    const certificate = await CertificateCredential.findByIdAndUpdate(
      body.certificateId,
      { status },
      { returnDocument: "after", runValidators: true }
    ).lean();

    if (!certificate) return Response.json({ error: "Certificate not found." }, { status: 404 });

    return Response.json({ certificate: { ...certificate, id: String(certificate._id) }, status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Certificate update failed." }, { status: 500 });
  }
}
