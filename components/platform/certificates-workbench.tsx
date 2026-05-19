"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, CheckCircle2, Copy, Download, Eye, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { certificateTemplates } from "@/lib/platform-data";
import { brand } from "@/lib/brand";
import { usePlatformStore } from "@/hooks/use-platform-store";

type CourseCatalogItem = {
  title: string;
  slug: string;
  duration: string;
  progress: number;
  instructor: string;
};

type CertificateItem = {
  courseSlug: string;
  courseTitle: string;
  verificationCode: string;
  issuedAt: string;
  template: string;
};

function createCertificateUrl({
  certificate,
  learnerName,
  courses,
  download
}: {
  certificate: {
    courseSlug: string;
    courseTitle: string;
    verificationCode: string;
    issuedAt: string;
    template: string;
  };
  learnerName: string;
  courses: CourseCatalogItem[];
  download?: boolean;
}) {
  const course = courses.find((item) => item.slug === certificate.courseSlug);
  const params = new URLSearchParams({
    student: learnerName,
    course: certificate.courseTitle,
    code: certificate.verificationCode,
    issuedAt: certificate.issuedAt,
    instructor: course?.instructor ?? "MR Creativist Instructor",
    template: certificate.template,
    hours: course?.duration ?? "42 hours",
    score: "96%"
  });

  if (download) {
    params.set("download", "1");
  }

  return `/api/certificates/pdf?${params.toString()}`;
}

export function CertificatesWorkbench({
  learnerName = "MR Creativist Learner",
  initialCourses = [],
  initialCertificates = []
}: {
  learnerName?: string;
  initialCourses?: CourseCatalogItem[];
  initialCertificates?: CertificateItem[];
}) {
  const [verificationQuery, setVerificationQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [remoteCertificates, setRemoteCertificates] = useState<CertificateItem[]>(initialCertificates);
  const localCertificates = usePlatformStore((state) => state.certificates);
  const courseProgress = usePlatformStore((state) => state.courseProgress);
  const createdCourses = usePlatformStore((state) => state.createdCourses);
  const issueCertificate = usePlatformStore((state) => state.issueCertificate);
  const courseCatalog = useMemo(
    () => [...initialCourses, ...createdCourses.filter((course) => course.status === "published")],
    [createdCourses, initialCourses]
  );
  const certificates = useMemo(() => {
    const byCode = new Map<string, CertificateItem>();

    for (const certificate of [...remoteCertificates, ...localCertificates]) {
      byCode.set(certificate.verificationCode, certificate);
    }

    return Array.from(byCode.values());
  }, [localCertificates, remoteCertificates]);

  const eligibleCourses = useMemo(
    () =>
      courseCatalog.filter(
        (course) =>
          (courseProgress[course.slug] ?? course.progress) >= 90 &&
          !certificates.some((certificate) => certificate.courseSlug === course.slug)
      ),
    [certificates, courseCatalog, courseProgress]
  );

  const verifiedCertificate = certificates.find((certificate) =>
    certificate.verificationCode.toLowerCase().includes(verificationQuery.toLowerCase())
  );
  const selectedCertificate =
    certificates.find((certificate) => certificate.verificationCode === selectedCode) ?? certificates[0] ?? null;
  const selectedCourse = selectedCertificate
    ? courseCatalog.find((course) => course.slug === selectedCertificate.courseSlug)
    : null;

  async function issueDatabaseCertificate(course: CourseCatalogItem) {
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: course.slug,
          courseTitle: course.title,
          template: "Professional"
        })
      });
      const payload = await response.json();

      if (response.ok) {
        setRemoteCertificates(payload.items ?? []);
        setSelectedCode(payload.item?.verificationCode ?? null);
        return;
      }
    } catch {
      // Keep the local fallback below when the network is unavailable.
    }

    issueCertificate({
      courseSlug: course.slug,
      courseTitle: course.title,
      template: "Professional"
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Award className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Certificate center</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Issued", value: certificates.length },
              { label: "Eligible", value: eligibleCourses.length },
              { label: "Templates", value: certificateTemplates.length }
            ].map((metric) => (
              <div key={metric.label} className="rounded-lg border border-[hsl(var(--border))] p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                <p className="mt-1 text-3xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Verify certificate</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={verificationQuery}
              onChange={(event) => setVerificationQuery(event.target.value)}
              placeholder="Enter verification code"
            />
            {verificationQuery ? (
              verifiedCertificate ? (
                <div className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-[hsl(var(--primary))]">
                    <CheckCircle2 className="size-4" />
                    Verified
                  </p>
                  <p className="mt-1 text-[hsl(var(--muted-foreground))]">{verifiedCertificate.courseTitle}</p>
                </div>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No local certificate matches that code.</p>
              )
            ) : null}
          </CardContent>
        </Card>
      </section>

      {selectedCertificate ? (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Preview</p>
              <CardTitle>Certificate design</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link
                  href={createCertificateUrl({ certificate: selectedCertificate, learnerName, courses: courseCatalog })}
                  target="_blank"
                >
                  <Eye className="size-4" />
                  Open PDF preview
                </Link>
              </Button>
              <Button asChild>
                <Link href={createCertificateUrl({ certificate: selectedCertificate, learnerName, courses: courseCatalog, download: true })}>
                  <Download className="size-4" />
                  Download PDF
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-5xl rounded-lg border border-[hsl(var(--border))] bg-slate-100 p-4 text-slate-950 shadow-sm">
              <div className="relative overflow-hidden rounded-md border border-slate-300 bg-white p-8 shadow-sm sm:p-10">
                <div className="absolute left-0 top-0 h-full w-2 bg-teal-600" />
                <div className="absolute inset-x-10 top-8 h-px bg-slate-200" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="relative flex size-20 overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                      <Image src={brand.logo} alt={brand.name} fill sizes="80px" className="object-contain p-1" />
                    </span>
                    <div>
                      <p className="text-base font-black uppercase tracking-[0.2em] text-slate-950">MR CREATIVIST</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                        Verified digital credential
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="border-teal-700 text-teal-800">{selectedCertificate.template}</Badge>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">Credential status</p>
                    <p className="font-semibold text-teal-800">Verified original</p>
                  </div>
                </div>

                <div className="relative py-12 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.34em] text-slate-500">Certificate of completion</p>
                  <h2 className="mx-auto mt-7 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{learnerName}</h2>
                  <div className="mx-auto mt-6 h-px max-w-xl bg-teal-600" />
                  <p className="mt-6 text-sm text-slate-600">has successfully completed the professional learning program</p>
                  <p className="mx-auto mt-3 max-w-3xl text-2xl font-black text-teal-800">
                    {selectedCertificate.courseTitle}
                  </p>
                </div>

                <div className="relative grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Instructor</p>
                    <p className="mt-1 font-semibold">{selectedCourse?.instructor ?? "MR Creativist Instructor"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Learning hours</p>
                    <p className="mt-1 font-semibold">{selectedCourse?.duration ?? "42 hours"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Final score</p>
                    <p className="mt-1 font-semibold">96%</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Issued</p>
                    <p className="mt-1 font-semibold">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                        new Date(selectedCertificate.issuedAt)
                      )}
                    </p>
                  </div>
                </div>

                <div className="relative mt-8 grid gap-4 border-t border-slate-200 pt-6 text-sm md:grid-cols-[1fr_auto] md:items-end">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="h-px bg-slate-400" />
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Platform Director</p>
                    </div>
                    <div>
                      <div className="h-px bg-slate-400" />
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Instructor Signature</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Verification code</p>
                    <p className="mt-1 font-mono text-sm font-black">{selectedCertificate.verificationCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <Card key={certificate.verificationCode} className="overflow-hidden">
            <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45 p-5">
              <Badge>{certificate.template}</Badge>
              <h2 className="mt-4 text-xl font-semibold">{certificate.courseTitle}</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Issued {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(certificate.issuedAt))}
              </p>
            </div>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Verification code</p>
                <p className="mt-1 font-mono text-sm font-semibold">{certificate.verificationCode}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedCode(certificate.verificationCode)}>
                  <Eye className="size-4" />
                  Preview
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={createCertificateUrl({ certificate, learnerName, courses: courseCatalog, download: true })}>
                    <Download className="size-4" />
                    PDF
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void navigator.clipboard?.writeText(certificate.verificationCode)}
                >
                  <Copy className="size-4" />
                  Code
                </Button>
                <Button asChild size="sm">
                  <Link href={createCertificateUrl({ certificate, learnerName, courses: courseCatalog })} target="_blank">
                    <ShieldCheck className="size-4" />
                    Verify
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {eligibleCourses.map((course) => (
          <Card key={course.slug}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>{course.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                This course is ready for automatic certificate generation.
              </p>
              <Button
                onClick={() => void issueDatabaseCertificate(course)}
              >
                <Award className="size-4" />
                Generate certificate
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Certificate templates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {certificateTemplates.map((template) => (
            <div key={template.name} className="rounded-lg border border-[hsl(var(--border))] p-4">
              <Badge>{template.color}</Badge>
              <h3 className="mt-3 font-semibold">{template.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{template.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
