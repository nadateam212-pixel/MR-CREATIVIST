import type { Metadata } from "next";
import { CertificatesWorkbench } from "@/components/platform/certificates-workbench";
import { getCourses } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Certificate Management"
};

export default async function AdminCertificatesPage() {
  const courses = await getCourses();

  return <CertificatesWorkbench learnerName="Platform Learner" initialCourses={courses} />;
}
