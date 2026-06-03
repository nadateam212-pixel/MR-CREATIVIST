"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, ExternalLink, FileCheck2, MessageSquare, Share2, ShieldCheck, ShieldOff, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PlatformRole } from "@/types";

const roleOptions: PlatformRole[] = ["client", "student", "instructor", "seller", "freelancer", "consultant", "admin"];
const accountStatuses = ["active", "review", "suspended"] as const;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  validatedRoles: PlatformRole[];
  accountStatus: "active" | "review" | "suspended";
  isVerified?: boolean;
  createdAt?: string;
};

type ApplicationDocument = {
  label: string;
  fileName?: string;
  url: string;
  kind: string;
};

type AccountApplication = {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  requestedRole: PlatformRole;
  status: "pending" | "approved" | "rejected" | "needs_more_info";
  professionalTitle: string;
  organization?: string;
  phone?: string;
  website?: string;
  summary: string;
  experienceYears: number;
  roleDetails?: Record<string, string>;
  documents: ApplicationDocument[];
  adminNotes?: string;
  updatedAt?: string;
};

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function UserRoleRow({ user, onSave }: { user: AdminUser; onSave: (user: AdminUser) => void }) {
  const [activeRole, setActiveRole] = useState<PlatformRole>(user.role);
  const [accountStatus, setAccountStatus] = useState(user.accountStatus);
  const [isVerified, setIsVerified] = useState(Boolean(user.isVerified));
  const [validatedRoles, setValidatedRoles] = useState<PlatformRole[]>(user.validatedRoles?.length ? user.validatedRoles : ["client"]);
  const [saving, setSaving] = useState(false);

  function toggleRole(role: PlatformRole) {
    setValidatedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
    );
  }

  async function save(nextStatus = accountStatus, verifiedOverride = isVerified) {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: activeRole, validatedRoles, accountStatus: nextStatus, isVerified: verifiedOverride })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "User update failed.");

      setAccountStatus(payload.user.accountStatus ?? nextStatus);
      onSave({
        ...user,
        role: payload.user.role,
        validatedRoles: payload.user.validatedRoles ?? [],
        accountStatus: payload.user.accountStatus ?? nextStatus,
        isVerified: Boolean(payload.user.isVerified)
      });
      setIsVerified(Boolean(payload.user.isVerified));
      toast.success("User controls saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User update failed.");
    } finally {
      setSaving(false);
    }
  }

  function shareUser() {
    void navigator.clipboard?.writeText(`${user.name} - ${user.email} - ${user.role}`);
    toast.success("User share summary copied.");
  }

  return (
    <tr>
      <td className="p-4">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
      </td>
      <td className="p-4">
        <select
          value={activeRole}
          onChange={(event) => setActiveRole(event.target.value as PlatformRole)}
          className="h-9 rounded-md border border-[hsl(var(--border))] bg-transparent px-2 text-sm"
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={isVerified} onChange={(event) => setIsVerified(event.target.checked)} />
          Verified badge
        </label>
      </td>
      <td className="p-4">
        <select
          value={accountStatus}
          onChange={(event) => setAccountStatus(event.target.value as typeof accountStatus)}
          className="h-9 rounded-md border border-[hsl(var(--border))] bg-transparent px-2 text-sm"
        >
          {accountStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>
      <td className="p-4">
        <div className="flex max-w-md flex-wrap gap-2">
          {roleOptions.map((role) => (
            <label key={role} className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--border))] px-2 py-1 text-xs">
              <input type="checkbox" checked={validatedRoles.includes(role)} onChange={() => toggleRole(role)} />
              {role}
            </label>
          ))}
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={() => void save()} disabled={saving || validatedRoles.length === 0}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => void save(accountStatus, true)} disabled={saving}>
            <BadgeCheck className="size-4" />
            Verify
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/messages/${user.id}`}>
              <MessageSquare className="size-4" />
              Message
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => void save(accountStatus === "suspended" ? "active" : "suspended")} disabled={saving || validatedRoles.length === 0}>
            {accountStatus === "suspended" ? <CheckCircle2 className="size-4" /> : <ShieldOff className="size-4" />}
            {accountStatus === "suspended" ? "Activate" : "Block"}
          </Button>
          <Button size="sm" variant="outline" onClick={shareUser}>
            <Share2 className="size-4" />
            Share
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function AdminAccountsManager({
  initialUsers,
  initialApplications
}: {
  initialUsers: AdminUser[];
  initialApplications: AccountApplication[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [applications, setApplications] = useState(initialApplications);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("pending");

  const filteredApplications = useMemo(
    () => applications.filter((application) => statusFilter === "all" || application.status === statusFilter),
    [applications, statusFilter]
  );

  const pendingCount = applications.filter((application) => application.status === "pending").length;
  const approvedCount = applications.filter((application) => application.status === "approved").length;
  const reviewCount = applications.filter((application) => application.status === "needs_more_info").length;

  async function reviewApplication(applicationId: string, status: AccountApplication["status"]) {
    const response = await fetch("/api/admin/account-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status, adminNotes: notes[applicationId] ?? "" })
    });
    const payload = await response.json();

    if (response.ok) {
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, ...payload.application, id: applicationId } : application
        )
      );
      toast.success(payload.message ?? "Application review saved.");
    } else {
      toast.error(payload.error ?? "Application review failed.");
    }
  }

  function updateUser(updatedUser: AdminUser) {
    setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12">
      <section className="relative min-h-[24rem] overflow-hidden rounded-lg border border-[hsl(var(--border))]">
        <Image
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1800&q=85"
          alt="Admin user validation workspace"
          fill
          sizes="(min-width: 1024px) 74vw, 100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/76" />
        <div className="relative flex min-h-[24rem] flex-col justify-end p-6 text-white sm:p-8 lg:p-10">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] backdrop-blur">
              <ShieldCheck className="size-4 text-cyan-300" />
              ADMIN VALIDATION
            </div>
            <h1 className="text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl">User accounts</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Validate seller, instructor, freelancer, and consultant accounts after checking documents. Client and
              student modes stay self-service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/admin/dashboard">
                  ADMIN DASHBOARD
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white bg-white/10 text-white hover:bg-white/20">
                <Link href="#validated-users">
                  <Users className="size-5" />
                  VALIDATED USERS
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45 p-4">
        <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending applications", value: pendingCount, icon: FileCheck2 },
          { label: "Approved roles", value: approvedCount, icon: CheckCircle2 },
          { label: "Needs more info", value: reviewCount, icon: ShieldCheck }
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6">
            <metric.icon className="mb-5 size-6 text-[hsl(var(--primary))]" />
            <p className="text-4xl font-black uppercase tracking-tight">{metric.value}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              {metric.label}
            </p>
          </div>
        ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">APPLICATION QUEUE</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Review professional roles</h2>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
          >
            {["pending", "needs_more_info", "approved", "rejected", "all"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="uppercase">Account applications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {filteredApplications.length ? (
            filteredApplications.map((application) => (
              <div key={application.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{application.requestedRole}</Badge>
                      <Badge>{application.status}</Badge>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(application.updatedAt)}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">{application.applicantName}</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {application.applicantEmail} - {application.professionalTitle}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-6">{application.summary}</p>
                    {application.roleDetails && Object.keys(application.roleDetails).length ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {Object.entries(application.roleDetails).map(([key, value]) => (
                          <div key={`${application.id}-${key}`} className="rounded-md border border-[hsl(var(--border))] p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                              {key.replace(/([A-Z])/g, " $1")}
                            </p>
                            <p className="mt-1 text-sm leading-6">{String(value || "Not provided")}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      {application.organization ? <span>{application.organization}</span> : null}
                      {application.phone ? <span>{application.phone}</span> : null}
                      {application.website ? (
                        <Link href={application.website} target="_blank" className="inline-flex items-center gap-1 text-[hsl(var(--primary))]">
                          Website <ExternalLink className="size-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="min-w-64 space-y-2">
                    <Input
                      value={notes[application.id] ?? application.adminNotes ?? ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                      placeholder="Admin notes"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void reviewApplication(application.id, "approved")}>
                        <CheckCircle2 className="size-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void reviewApplication(application.id, "needs_more_info")}>
                        More info
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void reviewApplication(application.id, "rejected")}>
                        <XCircle className="size-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {application.documents.map((document) => (
                    <Link
                      key={`${application.id}-${document.label}`}
                      href={document.url}
                      target="_blank"
                      className="rounded-md border border-[hsl(var(--border))] p-3 text-sm hover:bg-[hsl(var(--muted))]/45"
                    >
                      <span className="font-medium">{document.label}</span>
                      <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
                        {document.fileName || document.kind}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--primary))]">
                        Open document <ExternalLink className="size-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No applications in this status.
            </div>
          )}
        </CardContent>
        </Card>
      </section>

      <section id="validated-users" className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">ROLE CONTROL TABLE</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Users and validated accounts</h2>
        </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="uppercase">Users and validated accounts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Active account</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Validated roles</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {users.map((user) => (
                <UserRoleRow key={user.id} user={user} onSave={updateUser} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </section>
    </div>
  );
}
