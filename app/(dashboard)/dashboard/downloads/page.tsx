import type { Metadata } from "next";
import Link from "next/link";
import { Award, Download, ExternalLink, FileArchive, FileDown, Package, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectMongoDB, { hasMongoConfig } from "@/lib/mongodb";
import { getCertificateCredentials } from "@/lib/platform-ledger";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Order from "@/models/Order";

export const metadata: Metadata = {
  title: "Downloads"
};

type DownloadResource = {
  id: string;
  title: string;
  type: string;
  url: string;
  courseTitle: string;
  courseSlug: string;
  downloadable: boolean;
};

type CertificateDownload = {
  courseSlug: string;
  courseTitle: string;
  verificationCode: string;
  issuedAt: string;
  template: string;
};

type PurchaseDownload = {
  id: string;
  name: string;
  slug: string;
  orderId: string;
  status: string;
};

type PurchasedOrderItem = {
  name: string;
  slug: string;
};

function certificateUrl(certificate: CertificateDownload, learnerName: string, download = false) {
  const params = new URLSearchParams({
    student: learnerName,
    course: certificate.courseTitle,
    code: certificate.verificationCode,
    issuedAt: certificate.issuedAt,
    instructor: "MR Creativist Instructor",
    template: certificate.template,
    hours: "Self-paced",
    score: "96%"
  });

  if (download) params.set("download", "1");

  return `/api/certificates/pdf?${params.toString()}`;
}

async function getDownloadData(user?: { id?: string; email?: string | null; name?: string | null }) {
  const empty = { resources: [] as DownloadResource[], certificates: [] as CertificateDownload[], purchases: [] as PurchaseDownload[] };
  if (!user?.email || !hasMongoConfig()) return empty;

  try {
    await connectMongoDB();
    const learnerEmail = user.email.toLowerCase();
    const [enrollments, certificates, orders] = await Promise.all([
      Enrollment.find({ learnerEmail, status: { $in: ["active", "completed"] } }).select("courseId").lean(),
      getCertificateCredentials(user),
      Order.find({ buyerEmail: learnerEmail, status: { $in: ["paid", "fulfilled"] } }).sort({ createdAt: -1 }).limit(30).lean()
    ]);
    const courseIds = enrollments.map((enrollment) => enrollment.courseId).filter(Boolean);
    const courses = courseIds.length
      ? await Course.find({ _id: { $in: courseIds }, status: { $ne: "archived" } }).lean()
      : [];
    const resources: DownloadResource[] = [];

    for (const course of courses) {
      for (const resource of course.resources ?? []) {
        if (!resource.url) continue;
        resources.push({
          id: `${course.slug}-${resource.title}-${resource.url}`,
          title: resource.title ?? resource.label ?? "Course resource",
          type: resource.type ?? "File",
          url: resource.url,
          courseTitle: course.title,
          courseSlug: course.slug,
          downloadable: resource.downloadable !== false
        });
      }

      for (const courseModule of course.modules ?? []) {
        for (const lesson of courseModule.lessons ?? []) {
          for (const resource of lesson.resources ?? []) {
            if (!resource.url) continue;
            resources.push({
              id: `${course.slug}-${lesson.title}-${resource.url}`,
              title: resource.title ?? resource.label ?? `${lesson.title} resource`,
              type: resource.type ?? "Lesson file",
              url: resource.url,
              courseTitle: course.title,
              courseSlug: course.slug,
              downloadable: resource.downloadable !== false
            });
          }
        }
      }
    }

    const purchases = orders.flatMap((order) =>
      (order.items ?? []).map((item: PurchasedOrderItem) => ({
        id: `${order._id}-${item.slug}`,
        name: item.name,
        slug: item.slug,
        orderId: String(order._id),
        status: order.status
      }))
    );

    return { resources, certificates, purchases };
  } catch {
    return empty;
  }
}

export default async function DownloadsPage() {
  const session = await auth();
  const data = await getDownloadData(session?.user);
  const learnerName = session?.user?.name ?? "MR Creativist Learner";

  return (
    <div className="content-frame space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Downloads</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Certificates, enrolled course files, and purchased digital items.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/my-courses">
            <FileArchive className="size-4" />
            My courses
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Certificates", value: data.certificates.length, icon: Award },
          { label: "Course files", value: data.resources.length, icon: Download },
          { label: "Purchases", value: data.purchases.length, icon: Package }
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <metric.icon className="mb-4 size-5 text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-1 text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Award className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Certificates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.certificates.length ? (
              data.certificates.map((certificate) => (
                <div key={certificate.verificationCode} className="rounded-lg border border-[hsl(var(--border))] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge>{certificate.template}</Badge>
                      <h2 className="mt-3 font-semibold">{certificate.courseTitle}</h2>
                      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{certificate.verificationCode}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={certificateUrl(certificate, learnerName)} target="_blank">
                          <ShieldCheck className="size-4" />
                          Open
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={certificateUrl(certificate, learnerName, true)}>
                          <FileDown className="size-4" />
                          Download
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
                Completed course certificates will appear here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Course resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.resources.length ? (
              data.resources.map((resource) => (
                <div key={resource.id} className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--border))] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{resource.type}</Badge>
                      <Badge>{resource.courseTitle}</Badge>
                    </div>
                    <h2 className="mt-3 font-semibold">{resource.title}</h2>
                  </div>
                  <Button asChild size="sm">
                    <a href={resource.url} target="_blank" rel="noreferrer" download={resource.downloadable ? "" : undefined}>
                      <Download className="size-4" />
                      Download
                    </a>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
                Enrolled course resources will show here when instructors attach downloadable files.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="size-5 text-[hsl(var(--primary))]" />
            <CardTitle>Purchased products and templates</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.purchases.length ? (
            data.purchases.map((purchase) => (
              <div key={purchase.id} className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--border))] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge>{purchase.status}</Badge>
                  <h2 className="mt-3 font-semibold">{purchase.name}</h2>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Order #{purchase.orderId.slice(-8).toUpperCase()}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/marketplace/product/${purchase.slug}`}>
                    <ExternalLink className="size-4" />
                    Open
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))] md:col-span-2">
              Digital product purchases will appear here after checkout.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
