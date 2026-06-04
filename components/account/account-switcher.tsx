"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  FileUp,
  GraduationCap,
  Lock,
  Repeat2,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  WandSparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlatformRole } from "@/types";

type AccountRole = "client" | "student" | "instructor" | "seller" | "freelancer" | "consultant";
type RoleState = {
  role: AccountRole;
  label: string;
  active: boolean;
  available: boolean;
  pending: boolean;
  status: "available" | "pending" | "needs_more_info" | "locked";
  reason: string;
  dashboardPath: string;
  requirements: string[];
  applicationId: string | null;
};

type RolesResponse = {
  activeRole: PlatformRole;
  isAdmin: boolean;
  adminPath?: string;
  roles: RoleState[];
};

const roleIcons: Record<AccountRole, React.ComponentType<{ className?: string }>> = {
  client: UserRound,
  student: GraduationCap,
  instructor: WandSparkles,
  seller: ShoppingBag,
  freelancer: BriefcaseBusiness,
  consultant: ShieldCheck
};

export function AccountSwitcher({ activeRole }: { activeRole?: PlatformRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rolesData, setRolesData] = useState<RolesResponse | null>(null);
  const [message, setMessage] = useState("");

  async function loadRoles() {
    const response = await fetch("/api/account/roles", { cache: "no-store" });
    if (!response.ok) return;
    setRolesData(await response.json());
  }

  const activeLabel = useMemo(() => {
    if (rolesData?.isAdmin) return "Admin";
    const active = rolesData?.roles.find((role) => role.active);
    return active?.label ?? activeRole ?? "Account";
  }, [activeRole, rolesData]);

  async function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && !rolesData) {
      await loadRoles();
    }
  }

  async function switchRole(role: RoleState) {
    if (!role.available || role.active) return;

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.role })
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "This account mode is not available.");
        return;
      }

      await loadRoles();
      setOpen(false);
      router.push(payload.dashboardPath ?? role.dashboardPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (rolesData?.isAdmin) {
    return (
      <Button asChild variant="outline" className="hidden sm:inline-flex">
        <Link href={rolesData.adminPath ?? "/admin/dashboard"}>
          <ShieldCheck className="size-4" />
          Admin account
        </Link>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => void toggleOpen()}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="min-w-0"
      >
        <Repeat2 className="size-4" />
        <span className="hidden sm:inline">Switch account</span>
        <Badge className="hidden border-[hsl(var(--primary))] text-[hsl(var(--primary))] md:inline-flex">
          {activeLabel}
        </Badge>
        <ChevronDown className="size-4" />
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Switch account"
          className="absolute right-0 top-12 z-50 w-[min(92vw,42rem)] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Account modes</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Client, student, and Studio modes are self-service. Admin verification is used for trust badges and course publishing.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(rolesData?.roles ?? []).map((role) => {
              const Icon = roleIcons[role.role];

              return (
                <div key={role.role} className="rounded-md border border-[hsl(var(--border))] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 gap-2">
                      <Icon className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
                      <div className="min-w-0">
                        <p className="font-semibold">{role.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{role.reason}</p>
                      </div>
                    </div>
                    {role.active ? (
                      <CheckCircle2 className="size-4 shrink-0 text-[hsl(var(--primary))]" />
                    ) : role.available ? null : (
                      <Lock className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={role.active ? "default" : "outline"}
                      disabled={loading || role.active || !role.available}
                      onClick={() => void switchRole(role)}
                    >
                      {role.active ? "Active" : "Switch"}
                    </Button>
                    {!role.available && role.requirements.length > 0 ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/account/applications/${role.role}`} onClick={() => setOpen(false)}>
                          <FileUp className="size-4" />
                          {role.pending ? "View" : "Apply"}
                        </Link>
                      </Button>
                    ) : null}
                    {role.pending ? <Badge>{role.status === "needs_more_info" ? "Needs info" : "Pending"}</Badge> : null}
                  </div>
                </div>
              );
            })}
          </div>

          {message ? (
            <p
              className="mt-3 rounded-md border border-[hsl(var(--border))] p-3 text-sm text-[hsl(var(--destructive))]"
            >
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
