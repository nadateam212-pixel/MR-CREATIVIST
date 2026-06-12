"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, EllipsisVertical, ExternalLink, Eye, FileCheck2, KeyRound, MessageSquare, Search, Share2, ShieldCheck, ShieldOff, Trash2, UserCog, UserPlus, Users, XCircle } from "lucide-react";
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
  profileImage?: string;
  createdAt?: string;
  lastLoginAt?: string;
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
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function initials(value?: string) {
  return (value ?? "MC")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function UserRoleRow({
  user,
  onSave,
  selected,
  onToggle
}: {
  user: AdminUser;
  onSave: (user: AdminUser) => void;
  selected: boolean;
  onToggle: () => void;
}) {
  const [activeRole, setActiveRole] = useState<PlatformRole>(user.role);
  const [accountStatus, setAccountStatus] = useState(user.accountStatus);
  const [isVerified, setIsVerified] = useState(Boolean(user.isVerified));
  const [validatedRoles, setValidatedRoles] = useState<PlatformRole[]>(
    user.validatedRoles?.length ? user.validatedRoles : ["client", "student", "instructor", "seller", "freelancer", "consultant"]
  );
  const [saving, setSaving] = useState(false);
  const [roleEditorOpen, setRoleEditorOpen] = useState(false);

  function toggleRole(role: PlatformRole) {
    setValidatedRoles((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
  }

  async function save(nextStatus = accountStatus, verifiedOverride = isVerified, nextRoles = validatedRoles, nextRole = activeRole) {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole, validatedRoles: nextRoles, accountStatus: nextStatus, isVerified: verifiedOverride })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "User update failed.");

      const updatedUser = {
        ...user,
        role: payload.user.role,
        validatedRoles: payload.user.validatedRoles ?? [],
        accountStatus: payload.user.accountStatus ?? nextStatus,
        isVerified: Boolean(payload.user.isVerified)
      };
      setActiveRole(updatedUser.role);
      setValidatedRoles(updatedUser.validatedRoles);
      setAccountStatus(updatedUser.accountStatus);
      setIsVerified(updatedUser.isVerified);
      onSave(updatedUser);
      toast.success("User controls saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User update failed.");
    } finally {
      setSaving(false);
    }
  }

  function shareUser() {
    void navigator.clipboard?.writeText(`${window.location.origin}/profile/${user.id}`);
    toast.success("Profile link copied.");
  }

  async function resetPassword() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/password-reset`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Password reset failed.");
      toast.success(payload.message ?? "Password reset link sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setSaving(false);
    }
  }

  function fullAccessRoles() {
    const roles = ["client", "student", "instructor", "seller", "freelancer", "consultant"] as PlatformRole[];
    setValidatedRoles(roles);
    void save(accountStatus, isVerified, roles);
  }

  return (
    <>
      <tr className="border-b border-[hsl(var(--border))] last:border-b-0">
        <td className="p-4">
          <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${user.name}`} className="size-4 rounded border-[hsl(var(--border))]" />
        </td>
        <td className="p-4">
          <div className="flex min-w-56 items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-[hsl(var(--muted))] text-xs font-black"
              style={user.profileImage ? { backgroundImage: `url(${user.profileImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
            >
              {user.profileImage ? null : initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 font-semibold">
                <span className="truncate">{user.name}</span>
                {isVerified ? <BadgeCheck className="size-4 shrink-0 text-emerald-500" /> : null}
              </span>
              <span className="block truncate text-xs text-[hsl(var(--muted-foreground))]">{validatedRoles.length} roles</span>
            </span>
          </div>
        </td>
        <td className="p-4 text-sm text-[hsl(var(--muted-foreground))]">{user.email}</td>
        <td className="p-4">
          <Badge>{activeRole}</Badge>
        </td>
        <td className="p-4">
          <Badge className={accountStatus === "active" ? "border-emerald-500/45 text-emerald-600" : accountStatus === "suspended" ? "border-[hsl(var(--destructive))]/45 text-[hsl(var(--destructive))]" : "border-amber-500/45 text-amber-600"}>
            {accountStatus}
          </Badge>
        </td>
        <td className="p-4">
          <Badge className={isVerified ? "border-emerald-500/45 text-emerald-600" : "border-amber-500/45 text-amber-600"}>
            {isVerified ? "verified" : "pending"}
          </Badge>
        </td>
        <td className="p-4 text-sm text-[hsl(var(--muted-foreground))]">{formatDate(user.createdAt)}</td>
        <td className="p-4 text-sm text-[hsl(var(--muted-foreground))]">{formatDate(user.lastLoginAt)}</td>
        <td className="p-4 text-right">
          <details className="relative inline-block">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] [&::-webkit-details-marker]:hidden" aria-label={`Actions for ${user.name}`}>
              <EllipsisVertical className="size-4" />
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-left shadow-xl">
              <Button asChild size="sm" variant="ghost" className="w-full justify-start">
                <Link href={`/profile/${user.id}`}>
                  <Eye className="size-4" />
                  View User
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="w-full justify-start">
                <Link href={`/admin/users/${user.id}`}>
                  <UserCog className="size-4" />
                  Edit User
                </Link>
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => void save(accountStatus, true)} disabled={saving}>
                <BadgeCheck className="size-4" />
                Verify User
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => setRoleEditorOpen((current) => !current)}>
                <UserCog className="size-4" />
                Change Role
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={fullAccessRoles} disabled={saving}>
                <ShieldCheck className="size-4" />
                View All User Roles
              </Button>
              <Button asChild size="sm" variant="ghost" className="w-full justify-start">
                <Link href={`/messages/${user.id}`}>
                  <MessageSquare className="size-4" />
                  Message
                </Link>
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={shareUser}>
                <Share2 className="size-4" />
                Share
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => void save(accountStatus === "suspended" ? "active" : "suspended")} disabled={saving || validatedRoles.length === 0}>
                {accountStatus === "suspended" ? <CheckCircle2 className="size-4" /> : <ShieldOff className="size-4" />}
                {accountStatus === "suspended" ? "Activate User" : "Suspend User"}
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => void resetPassword()} disabled={saving}>
                <KeyRound className="size-4" />
                Reset Password
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start text-[hsl(var(--destructive))]" onClick={() => void save("suspended")} disabled={saving}>
                <XCircle className="size-4" />
                Delete User
              </Button>
            </div>
          </details>
        </td>
      </tr>
      {roleEditorOpen ? (
        <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25">
          <td colSpan={9} className="p-4">
            <div className="grid gap-3 lg:grid-cols-[12rem_12rem_1fr_auto] lg:items-start">
              <select value={activeRole} onChange={(event) => setActiveRole(event.target.value as PlatformRole)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm capitalize">
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value as AdminUser["accountStatus"])} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm capitalize">
                {accountStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1.5">
                {roleOptions.map((role) => (
                  <label key={role} className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--border))] px-2 py-1 text-xs">
                    <input type="checkbox" checked={validatedRoles.includes(role)} onChange={() => toggleRole(role)} />
                    {role}
                  </label>
                ))}
              </div>
              <Button size="sm" onClick={() => void save()} disabled={saving || validatedRoles.length === 0}>
                <CheckCircle2 className="size-4" />
                Save
              </Button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function AdminAccountsManager({
  initialUsers,
  initialApplications,
  mode = "users"
}: {
  initialUsers: AdminUser[];
  initialApplications: AccountApplication[];
  mode?: "users" | "applications";
}) {
  const [users, setUsers] = useState(initialUsers);
  const [applications, setApplications] = useState(initialApplications);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<PlatformRole>("client");
  const [bulkBusy, setBulkBusy] = useState(false);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return users.filter((user) => {
      const target = `${user.name} ${user.email} ${user.role} ${user.validatedRoles.join(" ")}`.toLowerCase();
      const matchesSearch = !search || target.includes(search);
      const matchesRole = roleFilter === "all" || user.role === roleFilter || user.validatedRoles.includes(roleFilter as PlatformRole);
      const matchesAccount = accountFilter === "all" || user.accountStatus === accountFilter;
      const matchesVerification = verificationFilter === "all" || (verificationFilter === "verified" ? user.isVerified : !user.isVerified);
      return matchesSearch && matchesRole && matchesAccount && matchesVerification;
    });
  }, [accountFilter, query, roleFilter, users, verificationFilter]);

  const filteredApplications = useMemo(
    () => applications.filter((application) => statusFilter === "all" || application.status === statusFilter),
    [applications, statusFilter]
  );

  function updateUser(updatedUser: AdminUser) {
    setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
  }

  function toggleUser(userId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleIds = filteredUsers.map((user) => user.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  async function applyBulkAction(action: "verify" | "activate" | "suspend" | "delete" | "change_role") {
    const userIds = Array.from(selectedIds);
    if (!userIds.length) return;
    if (action === "delete" && !window.confirm(`Permanently delete ${userIds.length} selected user account(s)?`)) return;

    setBulkBusy(true);
    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, action, role: action === "change_role" ? bulkRole : undefined })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Bulk user action failed.");

      const affected = new Set<string>(payload.affectedIds ?? []);
      if (action === "delete") {
        setUsers((current) => current.filter((user) => !affected.has(user.id)));
      } else {
        setUsers((current) =>
          current.map((user) => {
            if (!affected.has(user.id)) return user;
            if (action === "verify") return { ...user, isVerified: true };
            if (action === "activate" || action === "suspend") return { ...user, accountStatus: action === "activate" ? "active" : "suspended" };
            return { ...user, role: bulkRole, validatedRoles: Array.from(new Set([...user.validatedRoles, bulkRole])) };
          })
        );
      }
      setSelectedIds(new Set(payload.protectedIds ?? []));
      toast.success(payload.message ?? `${affected.size} users updated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk user action failed.");
    } finally {
      setBulkBusy(false);
    }
  }

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{mode === "applications" ? "Account applications" : "Users Management"}</h1>
          <div className={mode === "applications" ? "mt-3 flex flex-wrap gap-2" : "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"}>
            {(mode === "applications"
              ? [
                  ["Pending", applications.filter((application) => application.status === "pending").length],
                  ["Needs info", applications.filter((application) => application.status === "needs_more_info").length],
                  ["Approved", applications.filter((application) => application.status === "approved").length],
                  ["Rejected", applications.filter((application) => application.status === "rejected").length]
                ]
              : [
                  ["Total", users.length],
                  ["Active", users.filter((user) => user.accountStatus === "active").length],
                  ["Verified", users.filter((user) => user.isVerified).length],
                  ["Suspended", users.filter((user) => user.accountStatus === "suspended").length]
                ]).map(([label, value], index) => (
              mode === "applications" ? (
                <Badge key={String(label)} className="px-3 py-1">{label}: {Number(value).toLocaleString()}</Badge>
              ) : (
                <div key={String(label)} className="flex min-w-48 items-center gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                    {index === 0 ? <Users className="size-5" /> : index === 1 ? <CheckCircle2 className="size-5 text-emerald-500" /> : index === 2 ? <BadgeCheck className="size-5 text-cyan-500" /> : <ShieldOff className="size-5 text-rose-500" />}
                  </span>
                  <span><span className="block text-xs font-semibold text-[hsl(var(--muted-foreground))]">{label} users</span><span className="mt-1 block text-2xl font-black">{Number(value).toLocaleString()}</span></span>
                </div>
              )
            ))}
          </div>
        </div>
        {mode === "applications" ? (
          <Button asChild variant="outline">
            <Link href="/admin/users">
              <UserCog className="size-4" />
              Users
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/register">
              <UserPlus className="size-4" />
              Create user
            </Link>
          </Button>
        )}
      </section>

      {mode !== "applications" ? (
        <>
          <section className="grid gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 lg:grid-cols-[minmax(16rem,1fr)_10rem_10rem_10rem_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users by name or email..." className="pl-9" />
            </div>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
              <option value="all">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
              <option value="all">All status</option>
              {accountStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select value={verificationFilter} onChange={(event) => setVerificationFilter(event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
              <option value="all">All badges</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
            <Button type="button" variant="outline" onClick={() => toast.success(`${filteredUsers.length} users shown.`)}>
              Filter
            </Button>
          </section>

          {selectedIds.size ? (
            <section className="flex flex-col gap-3 rounded-md border border-emerald-500/35 bg-emerald-500/10 p-3 xl:flex-row xl:items-center">
              <p className="min-w-32 text-sm font-black text-emerald-700 dark:text-emerald-300">{selectedIds.size} selected</p>
              <div className="flex flex-1 flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void applyBulkAction("verify")} disabled={bulkBusy}><BadgeCheck className="size-4" />Verify</Button>
                <select value={bulkRole} onChange={(event) => setBulkRole(event.target.value as PlatformRole)} className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm capitalize">
                  {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <Button size="sm" variant="outline" onClick={() => void applyBulkAction("change_role")} disabled={bulkBusy}><UserCog className="size-4" />Change role</Button>
                <Button size="sm" variant="outline" onClick={() => void applyBulkAction("activate")} disabled={bulkBusy}><CheckCircle2 className="size-4" />Activate</Button>
                <Button size="sm" variant="outline" onClick={() => void applyBulkAction("suspend")} disabled={bulkBusy}><ShieldOff className="size-4" />Suspend</Button>
                <Button size="sm" variant="outline" className="text-[hsl(var(--destructive))]" onClick={() => void applyBulkAction("delete")} disabled={bulkBusy}><Trash2 className="size-4" />Delete</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} disabled={bulkBusy}><XCircle className="size-4" />Clear</Button>
              </div>
            </section>
          ) : null}

          <Card className="overflow-hidden">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[76rem] text-left text-sm">
                <thead className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="w-12 p-4">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && filteredUsers.every((user) => selectedIds.has(user.id))}
                        onChange={toggleAllVisible}
                        aria-label="Select all visible users"
                        className="size-4 rounded border-[hsl(var(--border))]"
                      />
                    </th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Verification</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium">Last activity</th>
                    <th className="p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <UserRoleRow key={user.id} user={user} onSave={updateUser} selected={selectedIds.has(user.id)} onToggle={() => toggleUser(user.id)} />
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No users match these filters.</div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      {mode !== "users" ? (
        <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <FileCheck2 className="size-5 text-[hsl(var(--primary))]" />
            <CardTitle>Account applications</CardTitle>
            <Badge>{filteredApplications.length}</Badge>
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
            {["pending", "needs_more_info", "approved", "rejected", "all"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="grid gap-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{application.requestedRole}</Badge>
                    <Badge className={application.status === "approved" ? "border-emerald-500/45 text-emerald-600" : application.status === "rejected" ? "border-[hsl(var(--destructive))]/45 text-[hsl(var(--destructive))]" : "border-amber-500/45 text-amber-600"}>
                      {application.status}
                    </Badge>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(application.updatedAt)}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{application.applicantName}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{application.applicantEmail} - {application.professionalTitle}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6">{application.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {application.documents.map((document) => (
                      <Button key={`${application.id}-${document.label}`} asChild size="sm" variant="outline">
                        <Link href={document.url} target="_blank">
                          <ExternalLink className="size-4" />
                          {document.label}
                        </Link>
                      </Button>
                    ))}
                    {application.website ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={application.website} target="_blank">
                          <ExternalLink className="size-4" />
                          Website
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="min-w-64 space-y-2">
                  <Input value={notes[application.id] ?? application.adminNotes ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))} placeholder="Admin notes" />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void reviewApplication(application.id, "approved")}>
                      <CheckCircle2 className="size-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void reviewApplication(application.id, "needs_more_info")}>
                      <ShieldCheck className="size-4" />
                      More info
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void reviewApplication(application.id, "rejected")}>
                      <XCircle className="size-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredApplications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No applications in this status.
            </div>
          ) : null}
        </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
