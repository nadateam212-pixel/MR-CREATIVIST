"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Copy,
  Download,
  Link2,
  MessageSquare,
  ReceiptText,
  Settings,
  Sparkles,
  Wallet,
  type LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProfileTool = {
  label: string;
  href: string;
  icon: string;
};

const toolIcons: Record<string, LucideIcon> = {
  dashboard: BookOpen,
  studio: Sparkles,
  orders: ReceiptText,
  downloads: Download,
  wallet: Wallet,
  messages: MessageSquare,
  settings: Settings
};

export function ReferralCopyBox({ code }: { code: string }) {
  const referralLink = useMemo(() => (typeof window === "undefined" ? `/register?ref=${code}` : `${window.location.origin}/register?ref=${code}`), [code]);

  function copyLink() {
    void navigator.clipboard?.writeText(referralLink);
    toast.success("Referral link copied.");
  }

  return (
    <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">Referral</p>
          <p className="mt-1 truncate font-mono text-sm font-black">{code}</p>
        </div>
        <Button type="button" size="icon" variant="outline" onClick={copyLink} aria-label="Copy referral link">
          <Copy className="size-4" />
        </Button>
      </div>
      <p className="mt-2 truncate text-xs text-[hsl(var(--muted-foreground))]">
        <Link2 className="mr-1 inline size-3" />
        {referralLink}
      </p>
    </div>
  );
}

export function ProfileToolsToggle({ tools }: { tools: ProfileTool[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <Button type="button" variant={open ? "default" : "outline"} onClick={() => setOpen((current) => !current)}>
          <Award className="size-4" />
          Tools
        </Button>
        {open ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <Button key={tool.href} asChild variant="outline" className="h-auto justify-start p-4">
                <Link href={tool.href}>
                  {(() => {
                    const Icon = toolIcons[tool.icon] ?? Link2;
                    return <Icon className="size-5 text-[hsl(var(--primary))]" />;
                  })()}
                  <span>{tool.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
