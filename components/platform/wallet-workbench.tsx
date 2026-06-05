"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CreditCard,
  Download,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatConvertedAmount, type SupportedCurrency } from "@/lib/currency";
import { walletSnapshot as staticWalletConfig } from "@/lib/platform-data";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  rawAmount?: number;
  direction?: "credit" | "debit";
  currency: string;
  status: string;
  description: string;
  counterpartyEmail?: string;
  requestTransactionId?: string;
  providerReference?: string;
  mobilePhone?: string;
  balanceAfter?: number;
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

type WalletWorkbenchProps = {
  initialSnapshot?: WalletSnapshot;
  initialError?: string;
};

const fallbackSnapshot: WalletSnapshot = {
  balance: 0,
  pendingBalance: 0,
  totalEarned: 0,
  totalWithdrawn: 0,
  currency: "FRW",
  transactions: []
};

function parseMoney(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function supportedCurrency(value = "USD"): SupportedCurrency {
  return value === "FRW" || value === "RWF" ? "FRW" : "USD";
}

function transactionLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function WalletWorkbench({ initialSnapshot, initialError = "" }: WalletWorkbenchProps) {
  const [wallet, setWallet] = useState<WalletSnapshot>(initialSnapshot ?? fallbackSnapshot);
  const [databaseReady, setDatabaseReady] = useState(Boolean(initialSnapshot) || !initialError);
  const [depositAmount, setDepositAmount] = useState("5000");
  const [withdrawAmount, setWithdrawAmount] = useState("2000");
  const [transferAmount, setTransferAmount] = useState("1000");
  const [depositPhone, setDepositPhone] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [recipient, setRecipient] = useState("seller@mrcreativist.local");
  const [status, setStatus] = useState(initialError);
  const [busy, setBusy] = useState("");
  const preferences = useUserPreferences();
  const displayMoney = (value: number, currency = wallet.currency) =>
    formatConvertedAmount(value, supportedCurrency(currency), preferences.currency, preferences.usdToFrw);

  const totals = [
    { label: "Pending", value: displayMoney(wallet.pendingBalance), icon: Banknote },
    { label: "Earned", value: displayMoney(wallet.totalEarned), icon: ArrowDownToLine },
    { label: "Withdrawn", value: displayMoney(wallet.totalWithdrawn), icon: ArrowUpFromLine }
  ];

  async function refreshWallet() {
    setBusy("refresh");
    setStatus("Refreshing wallet...");
    try {
      const response = await fetch("/api/wallet", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        setDatabaseReady(false);
        setStatus(payload.error ?? "Wallet refresh failed.");
        return;
      }

      setWallet(payload);
      setDatabaseReady(true);
      setStatus("Wallet synced.");
    } catch {
      setDatabaseReady(false);
      setStatus("Wallet refresh failed. Check the server log.");
    } finally {
      setBusy("");
    }
  }

  async function runWalletAction(action: string, amount: number, extra?: Record<string, string>) {
    if (amount <= 0) {
      setStatus("Enter an amount greater than zero.");
      return;
    }

    setBusy(action);
    setStatus("Recording transaction...");
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount, ...extra })
      });
      const payload = await response.json();

      if (!response.ok) {
        setDatabaseReady(!payload.degraded);
        setStatus(payload.error ?? "Transaction failed.");
        return;
      }

      setWallet(payload);
      setDatabaseReady(true);
      setStatus(action === "deposit" ? "Deposit request sent. Confirm the MTN Mobile Money prompt." : `${action} recorded in wallet ledger.`);
    } catch {
      setDatabaseReady(false);
      setStatus("Transaction failed. Check the server log.");
    } finally {
      setBusy("");
    }
  }

  function exportWallet() {
    const blob = new Blob([JSON.stringify(wallet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wallet-transactions.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Wallet export generated.");
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader className="bg-[hsl(var(--muted))]/45">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Available wallet balance</p>
                <CardTitle className="mt-2 text-4xl">{displayMoney(wallet.balance)}</CardTitle>
                {status ? <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{status}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={databaseReady ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-[hsl(var(--destructive))] text-[hsl(var(--destructive))]"}>
                  {databaseReady ? "Synced ledger" : "Ledger offline"}
                </Badge>
                <Button type="button" size="sm" variant="outline" onClick={() => void refreshWallet()} disabled={busy === "refresh"}>
                  <RefreshCw className="size-4" />
                  Sync
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            {totals.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-[hsl(var(--border))] p-4">
                <metric.icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2">
              <p className="font-medium">Supported methods</p>
              <div className="flex flex-wrap gap-2">
                {staticWalletConfig.methods.map((method) => (
                  <Badge key={method}>{method}</Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2 text-[hsl(var(--muted-foreground))]">
              <p>Minimum withdrawal: {displayMoney(staticWalletConfig.limits.minimumWithdrawal)}</p>
              <p>Daily transfer limit: {displayMoney(staticWalletConfig.limits.dailyTransfer)}</p>
              <p>Extra verification above: {displayMoney(staticWalletConfig.limits.verificationRequiredAbove)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Receive</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} inputMode="decimal" aria-label="Deposit amount in FRW" />
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                className="pl-9"
                value={depositPhone}
                onChange={(event) => setDepositPhone(event.target.value)}
                inputMode="tel"
                placeholder="MTN number"
                aria-label="MTN Mobile Money deposit phone"
              />
            </div>
            <Button
              className="w-full"
              disabled={busy === "deposit"}
              onClick={() =>
                void runWalletAction("deposit", parseMoney(depositAmount), {
                  currency: "FRW",
                  mobilePhone: depositPhone,
                  paymentMethod: "intouch_mtn_momo"
                })
              }
            >
              <ArrowDownToLine className="size-4" />
              Request MTN deposit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Banknote className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Withdraw</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} inputMode="decimal" aria-label="Withdrawal amount in FRW" />
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                className="pl-9"
                value={withdrawPhone}
                onChange={(event) => setWithdrawPhone(event.target.value)}
                inputMode="tel"
                placeholder="MTN number"
                aria-label="MTN Mobile Money withdrawal phone"
              />
            </div>
            <Button
              className="w-full"
              variant="outline"
              disabled={busy === "withdraw"}
              onClick={() =>
                void runWalletAction("withdraw", parseMoney(withdrawAmount), {
                  currency: "FRW",
                  mobilePhone: withdrawPhone
                })
              }
            >
              <ArrowUpFromLine className="size-4" />
              Send to MTN
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Send className="size-5 text-[hsl(var(--primary))]" />
              <CardTitle>Transfer</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={recipient} onChange={(event) => setRecipient(event.target.value)} />
            <Input value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} inputMode="decimal" />
            <Button
              className="w-full"
              variant="outline"
              disabled={busy === "transfer"}
              onClick={() => void runWalletAction("transfer", parseMoney(transferAmount), { recipientEmail: recipient, currency: wallet.currency })}
            >
              <Send className="size-4" />
              Transfer
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="size-5 text-[hsl(var(--primary))]" />
            <CardTitle>Transactions</CardTitle>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={exportWallet}>
            <Download className="size-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="py-3 font-medium">Type</th>
                  <th className="py-3 font-medium">Description</th>
                  <th className="py-3 font-medium">Counterparty</th>
                  <th className="py-3 font-medium">Reference</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {wallet.transactions.length ? (
                  wallet.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-3 font-medium capitalize">{transactionLabel(transaction.type)}</td>
                      <td className="py-3 text-[hsl(var(--muted-foreground))]">{transaction.description}</td>
                      <td className="py-3 text-[hsl(var(--muted-foreground))]">{transaction.counterpartyEmail ?? transaction.mobilePhone ?? "-"}</td>
                      <td className="py-3 text-xs text-[hsl(var(--muted-foreground))]">
                        {transaction.providerReference ?? transaction.requestTransactionId ?? "-"}
                      </td>
                      <td className="py-3">
                        <Badge>
                          <ShieldCheck className="mr-1 size-3" />
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className={`py-3 text-right font-semibold ${transaction.amount >= 0 ? "text-[hsl(var(--primary))]" : ""}`}>
                        {displayMoney(transaction.amount, transaction.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                      No wallet transactions yet. Deposit, earn, transfer, or request a payout to create the first ledger entry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
