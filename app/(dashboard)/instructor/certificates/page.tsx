import type { Metadata } from "next";
import { auth } from "@/auth";
import { CertificatesWorkbench } from "@/components/platform/certificates-workbench";
import { getCertificateCredentials } from "@/lib/platform-ledger";
import { getCourses } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Instructor Certificates"
};

export default async function InstructorCertificatesPage() {
  const [session, courses] = await Promise.all([auth(), getCourses()]);
  const certificates = session?.user ? await getCertificateCredentials(session.user) : [];

  return (
    <CertificatesWorkbench
      learnerName={session?.user?.name ?? "MR Creativist Learner"}
      initialCourses={courses}
      initialCertificates={certificates}
    />
  );
}
