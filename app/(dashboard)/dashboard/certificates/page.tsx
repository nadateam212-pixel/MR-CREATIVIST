import type { Metadata } from "next";
import { auth } from "@/auth";
import { CertificatesWorkbench } from "@/components/platform/certificates-workbench";
import { getCertificateCourseCatalog, getCertificateCredentials } from "@/lib/platform-ledger";
import { getCourses } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Certificates"
};

export default async function CertificatesPage() {
  const [session, courses] = await Promise.all([auth(), getCourses()]);
  const [certificates, completedCourses] = session?.user
    ? await Promise.all([getCertificateCredentials(session.user), getCertificateCourseCatalog(session.user)])
    : [[], []];
  const coursesBySlug = new Map([...courses, ...completedCourses].map((course) => [course.slug, course]));

  return (
    <CertificatesWorkbench
      learnerName={session?.user?.name ?? "MR Creativist Learner"}
      initialCourses={Array.from(coursesBySlug.values())}
      initialCertificates={certificates}
    />
  );
}
