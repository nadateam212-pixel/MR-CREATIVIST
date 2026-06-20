"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpFromLine, Copy, HandCoins, Link2, Loader2, Send, Share2, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  rawAmount?: number;
  currency: string;
  status: string;
  description: string;
  createdAt?: string;
};

type WalletSnapshot = {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  transactions: WalletTransaction[];
};

type ReferralView = {
  code: string;
  commissionRate: number;
  clicks: number;
  conversions: number;
  revenue: number;
  unpaidCommission: number;
};

type InviteView = {
  id: string;
  name: string;
  email: string;
  role?: string;
  accountStatus?: string;
  isVerified?: boolean;
  createdAt?: string;
};

type EarningsReferralsDashboardProps = {
  wallet: WalletSnapshot;
  referral: ReferralView;
  invites: InviteView[];
  variant?: "full" | "earnings" | "referrals";
};

const sourceLabels: Record<string, string> = {
  course_earning: "Courses",
  product_earning: "Products",
  freelance_earning: "Freelancers",
  consulting_earning: "Consulting",
  referral_earning: "Referrals"
};

const WITHDRAW_FEE_RATE = 0.072;

function money(value: number, currency = "FRW") {
  if (currency === "FRW" || currency === "RWF") {
    return `FRW ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(Number(value ?? 0)))}`;
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

function formatDate(value?: string) {
  if (!value) return "Recent";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function EarningsReferralsDashboard({ wallet: initialWallet, referral, invites, variant = "full" }: EarningsReferralsDashboardProps) {
  const [wallet, setWallet] = useState(initialWallet);
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const [withdrawAmount, setWithdrawAmount] = useState("5000");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("1000");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  const referralLink = `${origin || ""}/register?ref=${encodeURIComponent(referral.code)}`;
  const showEarnings = variant !== "referrals";
  const showReferrals = variant !== "earnings";
  const withdrawAmountNumber = Math.max(0, Number(withdrawAmount) || 0);
  const withdrawFee = Math.round(withdrawAmountNumber * WITHDRAW_FEE_RATE * 100) / 100;
  const withdrawNet = Math.max(0, Math.round((withdrawAmountNumber - withdrawFee) * 100) / 100);
  const sourceTotals = useMemo(() => {
    const totals = Object.fromEntries(Object.keys(sourceLabels).map((key) => [key, 0])) as Record<string, number>;

    for (const transaction of wallet.transactions ?? []) {
      if (!sourceLabels[transaction.type] || transaction.status !== "completed") continue;
      totals[transaction.type] += Math.max(0, Number(transaction.rawAmount ?? transaction.amount ?? 0));
    }

    return totals;
  }, [wallet.transactions]);

  async function copy(value: string, message: string) {
    await navigator.clipboard?.writeText(value);
    setStatus(message);
    toast.success(message);
  }

  async function runWalletAction(action: "withdraw" | "transfer") {
    const amount = Number(action === "withdraw" ? withdrawAmount : transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }

    setBusy(action);
    setStatus(action === "withdraw" ? "Sending withdrawal request..." : "Transferring balance...");
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "withdraw"
            ? { action: "withdraw", amount, currency: "FRW", mobilePhone: withdrawPhone, feeRate: WITHDRAW_FEE_RATE }
            : { action: "transfer", amount, currency: wallet.currency, recipientEmail }
        )
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Wallet action failed.");

      setWallet(payload);
      const nextStatus = action === "withdraw" ? "Withdrawal request saved." : "Transfer completed.";
      setStatus(nextStatus);
      toast.success(nextStatus);
    } catch (error) {
      const nextStatus = error instanceof Error ? error.message : "Wallet action failed.";
      setStatus(nextStatus);
      toast.error(nextStatus);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="content-frame space-y-6">
      <section className={`grid gap-4 ${showEarnings && showReferrals ? "lg:grid-cols-[1.15fr_0.85fr]" : ""}`}>
        {showEarnings ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge>Balance</Badge>
                  <CardTitle className="mt-3 text-4xl">{money(wallet.balance, wallet.currency)}</CardTitle>
                </div>
                <Button asChild variant="outline">
                  <Link href="/dashboard/wallet">
                    <Wallet className="size-4" />
                    Wallet
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {[
                ["Total earned", wallet.totalEarned],
                ["Pending", wallet.pendingBalance],
                ["Withdrawn", wallet.totalWithdrawn]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[hsl(var(--border))] p-4">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{money(Number(value), wallet.currency)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {showReferrals ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Share2 className="size-5 text-[hsl(var(--primary))]" />
                <CardTitle>Affiliate link</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-[hsl(var(--border))] p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Referral code</p>
                <p className="mt-2 font-mono text-2xl font-black">{referral.code}</p>
                <p className="mt-2 text-sm font-semibold text-[hsl(var(--primary))]">{Math.round(referral.commissionRate * 100)}% commission</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void copy(referralLink, "Referral link copied.")}>
                  <Link2 className="size-4" />
                  Copy link
                </Button>
                <Button type="button" variant="outline" onClick={() => void copy(referral.code, "Referral code copied.")}>
                  <Copy className="size-4" />
                  Copy code
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      {showEarnings ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Object.entries(sourceLabels).map(([type, label]) => (
            <Card key={type}>
              <CardContent className="p-4">
                <HandCoins className="mb-3 size-5 text-[hsl(var(--primary))]" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{money(sourceTotals[type], wallet.currency)}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {showEarnings ? (
          <Card>
            <CardHeader>
              <CardTitle>Manage earnings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} inputMode="decimal" aria-label="Withdrawal amount" />
                <Input value={withdrawPhone} onChange={(event) => setWithdrawPhone(event.target.value)} inputMode="tel" placeholder="MTN number" />
                <div className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-[hsl(var(--muted-foreground))]">Withdraw fee 7.2%</span>
                    <span className="font-semibold">{money(withdrawFee, "FRW")}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-3">
                    <span className="text-[hsl(var(--muted-foreground))]">You receive</span>
                    <span className="font-semibold">{money(withdrawNet, "FRW")}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => void runWalletAction("withdraw")} disabled={busy === "withdraw"}>
                  {busy === "withdraw" ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpFromLine className="size-4" />}
                  {busy === "withdraw" ? "Requesting..." : "Withdraw"}
                </Button>
              </div>
              <div className="space-y-3">
                <Input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} inputMode="email" placeholder="Recipient email" />
                <Input value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} inputMode="decimal" />
                <Button className="w-full" variant="outline" onClick={() => void runWalletAction("transfer")} disabled={busy === "transfer"}>
                  {busy === "transfer" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {busy === "transfer" ? "Transferring..." : "Transfer to wallet"}
                </Button>
              </div>
              {status ? <p className="text-sm text-[hsl(var(--muted-foreground))] md:col-span-2">{status}</p> : null}
            </CardContent>
          </Card>
        ) : null}

        {showReferrals ? (
          <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Invited accounts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Clicks", referral.clicks],
                ["Joined", invites.length],
                ["Commission", money(referral.unpaidCommission, wallet.currency)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[hsl(var(--border))] p-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {invites.map((invite) => (
                <div key={invite.id} className="rounded-md border border-[hsl(var(--border))] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{invite.name}</p>
                    <Badge>{invite.accountStatus ?? "active"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{invite.email}</p>
                  <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{invite.role ?? "client"} - joined {formatDate(invite.createdAt)}</p>
                </div>
              ))}
              {!invites.length ? (
                <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No invited accounts yet.
                </div>
              ) : null}
            </div>
          </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
