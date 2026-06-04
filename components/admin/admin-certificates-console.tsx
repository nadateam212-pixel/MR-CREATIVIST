"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, Download, Eye, Search, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type AdminCertificateRow = {
  id: string;
  kind: "issued" | "eligible";
  learnerName: string;
  userEmail: string;
  courseTitle: string;
  courseSlug: string;
  instructor?: string;
  verificationCode?: string;
  status: "issued" | "revoked" | "eligible";
  issuedAt?: string;
  enrollmentId?: string;
  progressPercent?: number;
};

function statusTone(status: string) {
  if (status === "issued") return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  if (status === "eligible") return "border-emerald-500/35 text-emerald-600";
  return "border-[hsl(var(--destructive))]/35 text-[hsl(var(--destructive))]";
}

function formatDate(value?: string) {
  if (!value) return "Not issued";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function certificateUrl(row: AdminCertificateRow, download = false) {
  const params = new URLSearchParams({
    student: row.learnerName,
    course: row.courseTitle,
    code: row.verificationCode ?? "PENDING",
    issuedAt: row.issuedAt ?? new Date().toISOString(),
    instructor: row.instructor ?? "MR Creativist Instructor",
    template: "Professional",
    hours: "42 hours",
    score: "96%"
  });

  if (download) params.set("download", "1");
  return `/api/certificates/pdf?${params.toString()}`;
}

export function AdminCertificatesConsole({ initialRows }: { initialRows: AdminCertificateRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [selectedRow, setSelectedRow] = useState<AdminCertificateRow | null>(initialRows[0] ?? null);
  const [busy, setBusy] = useState("");

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) =>
      `${row.learnerName} ${row.userEmail} ${row.courseTitle} ${row.courseSlug} ${row.verificationCode ?? ""} ${row.instructor ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [query, rows]);

  const issuedCount = rows.filter((row) => row.status === "issued").length;
  const eligibleCount = rows.filter((row) => row.status === "eligible").length;
  const revokedCount = rows.filter((row) => row.status === "revoked").length;
  const learnerCount = new Set(rows.map((row) => row.userEmail)).size;

  async function updateCertificate(row: AdminCertificateRow, action: "revoke" | "restore" | "delete") {
    if (!row.verificationCode) return;
    if (!window.confirm(`${action === "restore" ? "Restore" : action === "delete" ? "Delete" : "Revoke"} certificate for ${row.learnerName}?`)) return;

    setBusy(`${row.id}:${action}`);
    try {
      const response = await fetch("/api/admin/certificates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId: row.id, action })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Certificate update failed.");

      if (payload.deleted) {
        setRows((current) => current.filter((item) => item.id !== row.id));
        setSelectedRow((current) => (current?.id === row.id ? null : current));
      } else {
        const status = payload.status as "issued" | "revoked";
        setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status } : item)));
        setSelectedRow((current) => (current?.id === row.id ? { ...current, status } : current));
      }

      toast.success("Certificate updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Certificate update failed.");
    } finally {
      setBusy("");
    }
  }

  async function issueEligible(row: AdminCertificateRow) {
    if (!row.enrollmentId) return;

    setBusy(`${row.id}:issue`);
    try {
      const response = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: row.enrollmentId })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Certificate issue failed.");

      const certificate = payload.certificate;
      const nextRow: AdminCertificateRow = {
        ...row,
        id: String(certificate.id ?? certificate._id),
        kind: "issued",
        status: "issued",
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt
      };

      setRows((current) => current.map((item) => (item.id === row.id ? nextRow : item)));
      setSelectedRow(nextRow);
      toast.success("Certificate issued.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Certificate issue failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary))]/25 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--primary))]">
              <ShieldCheck className="size-3.5" />
              Credential registry
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Certificates</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Search every generated certificate and every completed student enrollment that is eligible for a credential.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,22rem)_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="pl-9"
                placeholder="Search names, users, courses, codes"
              />
            </label>
            <Button type="button" onClick={() => setQuery(draftQuery)}>
              <Search className="size-4" />
              Search
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Issued", value: issuedCount },
            { label: "Eligible", value: eligibleCount },
            { label: "Revoked", value: revokedCount },
            { label: "Learners", value: learnerCount }
          ].map((metric) => (
            <div key={metric.label} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-2 text-3xl font-black">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Certificate records</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[62rem] text-left text-sm">
              <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="p-4 font-medium">Learner</th>
                  <th className="p-4 font-medium">Course</th>
                  <th className="p-4 font-medium">Code</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {visibleRows.length ? (
                  visibleRows.map((row) => (
                    <tr key={`${row.kind}:${row.id}`}>
                      <td className="p-4">
                        <p className="font-semibold">{row.learnerName}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{row.userEmail}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{row.courseTitle}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{row.instructor ?? "Instructor not recorded"}</p>
                      </td>
                      <td className="p-4 font-mono text-xs">{row.verificationCode ?? "Not generated"}</td>
                      <td className="p-4">
                        <Badge className={statusTone(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedRow(row)}>
                            <Eye className="size-4" />
                            View
                          </Button>
                          {row.status === "eligible" ? (
                            <Button size="sm" onClick={() => void issueEligible(row)} disabled={busy === `${row.id}:issue`}>
                              <Award className="size-4" />
                              Issue
                            </Button>
                          ) : null}
                          {row.verificationCode ? (
                            <>
                              <Button asChild size="sm" variant="outline">
                                <Link href={certificateUrl(row, true)}>
                                  <Download className="size-4" />
                                  PDF
                                </Link>
                              </Button>
                              {row.status === "revoked" ? (
                                <Button size="sm" variant="outline" onClick={() => void updateCertificate(row, "restore")} disabled={busy === `${row.id}:restore`}>
                                  <CheckCircle2 className="size-4" />
                                  Restore
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => void updateCertificate(row, "revoke")} disabled={busy === `${row.id}:revoke`}>
                                  <XCircle className="size-4" />
                                  Revoke
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => void updateCertificate(row, "delete")} disabled={busy === `${row.id}:delete`}>
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      No certificates match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="h-max">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRow ? (
              <div className="space-y-3">
                {Object.entries({
                  learner: selectedRow.learnerName,
                  email: selectedRow.userEmail,
                  course: selectedRow.courseTitle,
                  instructor: selectedRow.instructor ?? "Not recorded",
                  status: selectedRow.status,
                  verificationCode: selectedRow.verificationCode ?? "Not generated",
                  issued: formatDate(selectedRow.issuedAt),
                  progress: `${selectedRow.progressPercent ?? 100}%`
                }).map(([key, value]) => (
                  <div key={`${selectedRow.id}:${key}`} className="rounded-md border border-[hsl(var(--border))] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                      {key.replace(/([A-Z])/g, " $1")}
                    </p>
                    <p className="mt-1 break-words text-sm leading-6">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Select a certificate record to inspect it here.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
