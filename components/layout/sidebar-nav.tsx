"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";

export function SidebarNav({ items, mobile = false }: { items: NavItem[]; mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={cn("mt-4 flex gap-1", mobile ? "overflow-x-auto" : "flex-col")}>
      {items.map((item) => {
        const exactOnly = ["/dashboard", "/seller", "/instructor", "/consultant", "/freelancer"].includes(item.href);
        const active = pathname === item.href || (!exactOnly && item.href !== "/" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {Icon ? <Icon className="size-4" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
