"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";
import {
  Activity,
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  Users
} from "lucide-react";
import { logoutAction } from "@/app/(dashboard)/actions";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Review queue", href: "/admin/account-applications", icon: ShieldCheck },
  { label: "Manage users", href: "/admin/users", icon: Users },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Health center", href: "/admin/health", icon: Activity },
  { label: "Admin settings", href: "/admin/settings", icon: Settings },
  { label: "Public site", href: "/", icon: Home }
];

function getInitials(name: string, email: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || email.slice(0, 1).toUpperCase() || "A";
}

export function AdminProfileMenu({ user }: { user: Session["user"] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = user.name ?? "Admin operator";
  const email = user.email ?? "admin@mrcreativist.com";
  const initials = getInitials(displayName, email);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-slate-950/72 px-2.5 pr-3 text-white shadow-xl shadow-slate-950/25 backdrop-blur-xl transition-colors hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          open && "bg-slate-900"
        )}
      >
        <span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--primary))] text-xs font-black text-[hsl(var(--primary-foreground))]">
          {initials}
        </span>
        <span className="hidden max-w-32 truncate text-left text-xs font-bold uppercase tracking-wide sm:block">
          Admin
        </span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        <span className="sr-only">Open admin profile tools</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Admin profile tools"
          className="absolute right-0 top-14 z-50 w-[min(92vw,21rem)] overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-2xl shadow-slate-950/25"
        >
          <div className="border-b border-[hsl(var(--border))] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary))] text-sm font-black text-[hsl(var(--primary-foreground))]">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">{email}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex rounded-full border border-[hsl(var(--primary))]/30 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-[hsl(var(--primary))]">
              Admin account
            </div>
          </div>

          <div className="grid p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                >
                  <Icon className="size-4 text-[hsl(var(--primary))]" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <form action={logoutAction} className="border-t border-[hsl(var(--border))] p-2">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-[hsl(var(--destructive))] transition-colors hover:bg-[hsl(var(--destructive))]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
