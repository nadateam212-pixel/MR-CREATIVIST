"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Wallet,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminPaymentTransaction = {
  id: string;
  type: string;
  amount: number;
  rawAmount: number;
  direction: "credit" | "debit";
  currency: string;
  status: string;
  description: string;
  userEmail?: string;
  counterpartyEmail?: string;
  referenceType?: string;
  referenceId?: string;
  requestTransactionId?: string;
  providerReference?: string;
  providerTransactionId?: string;
  mobilePhone?: string;
  createdAt?: string;
};

type AdminPaymentsSnapshot = {
  summary: {
    count: number;
    receivedFrw: number;
    sentFrw: number;
    pendingFrw: number;
    failed: number;
    completed: number;
  };
  transactions: AdminPaymentTransaction[];
  filters: {
    status: string;
    type: string;
    search: string;
  };
  updatedAt: string;
};

type AdminPaymentsConsoleProps = {
  initialSnapshot: AdminPaymentsSnapshot;
  initialProviderBalance?: number | null;
};

type PaymentBillDetail = {
  billNo: string;
  title: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  currency: "USD" | "FRW";
  status: string;
  paymentMethod: string;
  reference: string;
  paidAt: string;
  items: Array<{
    name: string;
    quantity: number;
    amount: number;
  }>;
};

type PaymentDetail = {
  transaction: AdminPaymentTransaction & {
    metadata?: Record<string, unknown>;
  };
  bill: PaymentBillDetail;
};

type ProxyAttemptDiagnostic = {
  url?: string;
  host?: string;
  status?: number;
  ok?: boolean;
  code?: string;
  message?: string;
  elapsedMs?: number;
};

const statusOptions = ["all", "pending", "completed", "failed", "cancelled"];
const typeOptions = ["all", "deposit", "withdrawal", "transfer_in", "transfer_out", "admin_payout", "purchase", "refund"];

function money(value: number) {
  return `FRW ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(Number(value ?? 0)))}`;
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function dateLabel(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function proxyDiagnostics(payload: unknown): ProxyAttemptDiagnostic[] {
  const value = payload as { data?: { proxy_attempts?: unknown } };
  const attempts = value?.data?.proxy_attempts;

  if (!Array.isArray(attempts)) return [];

  return attempts
    .map((attempt) => attempt as ProxyAttemptDiagnostic)
    .filter((attempt) => attempt.url || attempt.message || attempt.code);
}

export function AdminPaymentsConsole({ initialSnapshot, initialProviderBalance = null }: AdminPaymentsConsoleProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [status, setStatus] = useState(initialSnapshot.filters.status ?? "all");
  const [type, setType] = useState(initialSnapshot.filters.type ?? "all");
  const [search, setSearch] = useState(initialSnapshot.filters.search ?? "");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("MR Creativist payout");
  const [providerBalance, setProviderBalance] = useState<number | null>(
    typeof initialProviderBalance === "number" && Number.isFinite(initialProviderBalance)
      ? initialProviderBalance
      : null
  );
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [providerDiagnostics, setProviderDiagnostics] = useState<ProxyAttemptDiagnostic[]>([]);
  const [detail, setDetail] = useState<PaymentDetail | null>(null);

  const stats = useMemo(
    () => [
      { label: "Received", value: money(snapshot.summary.receivedFrw), helper: "Completed FRW credits", icon: ArrowDownToLine },
      { label: "Sent", value: money(snapshot.summary.sentFrw), helper: "Completed FRW debits", icon: ArrowUpFromLine },
      { label: "Pending", value: money(snapshot.summary.pendingFrw), helper: "Waiting for provider/user", icon: RefreshCw },
      { label: "Records", value: snapshot.summary.count.toLocaleString(), helper: `${snapshot.summary.failed} failed`, icon: Wallet }
    ],
    [snapshot.summary]
  );

  async function loadPayments(nextStatus = status, nextType = type, nextSearch = search) {
    setBusy("load");
    setMessage("Refreshing payments...");

    try {
      const params = new URLSearchParams({
        status: nextStatus,
        type: nextType,
        search: nextSearch
      });
      const response = await fetch(`/api/admin/payments?${params}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Payment refresh failed.");
        return;
      }

      setSnapshot(payload);
      setMessage("Payments synced.");
    } catch {
      setMessage("Payment refresh failed. Check the server log.");
    } finally {
      setBusy("");
    }
  }

  async function sendPayment() {
    setBusy("send");
    setMessage("Sending payment...");

    try {
      const response = await fetch("/api/admin/payments/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          mobilePhone,
          amount: Number(amount),
          reason
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Payment failed.");
        return;
      }

      setMessage(`Payment ${payload.transaction?.status ?? "recorded"}.`);
      await loadPayments();
    } catch {
      setMessage("Payment failed. Check the server log.");
    } finally {
      setBusy("");
    }
  }

  async function checkProviderBalance(showStatus = true) {
    setBusy("balance");
    if (showStatus) setMessage("Checking Intouch balance...");

    try {
      const response = await fetch("/api/admin/payments/balance", { cache: "no-store" });
      const payload = await response.json();
      const diagnostics = proxyDiagnostics(payload);
      setProviderDiagnostics(diagnostics);

      if (!response.ok) {
        if (showStatus) setMessage(payload.error ?? "Balance check failed.");
        return;
      }

      if (payload.ok === false) {
        if (showStatus) setMessage(payload.message ?? "Intouch balance is unavailable.");
        return;
      }

      const nextBalance = Number(payload.balance ?? 0);
      setProviderBalance(Number.isFinite(nextBalance) ? nextBalance : 0);
      setProviderDiagnostics([]);
      if (showStatus) setMessage("Intouch balance updated.");
    } catch {
      setProviderDiagnostics([]);
      if (showStatus) setMessage("Balance check failed. Check the server log.");
    } finally {
      setBusy("");
    }
  }

  async function refreshStatus(referenceId?: string) {
    if (!referenceId) return;

    setBusy(referenceId);
    setMessage("Refreshing provider status...");

    try {
      const response = await fetch("/api/admin/payments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceId })
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Status refresh failed.");
        return;
      }

      setMessage(`Transaction ${payload.transaction?.status ?? "updated"}.`);
      await loadPayments();
    } catch {
      setMessage("Status refresh failed. Check the server log.");
    } finally {
      setBusy("");
    }
  }

  async function viewPayment(transactionId: string) {
    setBusy(`view-${transactionId}`);
    setMessage("Loading payment details...");

    try {
      const response = await fetch(`/api/admin/payments/${transactionId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Payment details failed.");
        return;
      }

      setDetail(payload);
      setMessage("Payment details loaded.");
    } catch {
      setMessage("Payment details failed. Check the server log.");
    } finally {
      setBusy("");
    }
  }

  function downloadBill(transactionId: string) {
    window.open(`/api/admin/payments/${transactionId}/bill`, "_blank", "noopener,noreferrer");
  }

  function exportSnapshot() {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mr-creativist-payments-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Payment export generated.");
  }

  return (
    <div className="content-frame space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]">Finance</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Payments</h1>
          <p className="mt-2 max-w-3xl text-sm text-[hsl(var(--muted-foreground))]">
            Received wallet deposits, sent payouts, transfer records, and IntouchPay Mobile Money operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportSnapshot}>
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-[hsl(var(--primary))]/30 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--card))_45%,hsl(var(--accent)/0.18))]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-md border border-[hsl(var(--primary))]/30 bg-white/70 text-[hsl(var(--primary))] shadow-sm">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">Intouch balance</p>
              <p className="mt-1 text-4xl font-black tracking-tight">{providerBalance === null ? "FRW --" : money(providerBalance)}</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => void checkProviderBalance()} disabled={busy === "balance"}>
            <RefreshCw className={`size-4 ${busy === "balance" ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <metric.icon className="mb-3 size-5 text-[hsl(var(--primary))]" />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{metric.label}</p>
              <p className="mt-2 text-2xl font-black">{metric.value}</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <CardHeader>
            <CardTitle>Send payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} placeholder="recipient@email.com" inputMode="email" />
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input className="pl-9" value={mobilePhone} onChange={(event) => setMobilePhone(event.target.value)} inputMode="tel" placeholder="MTN number" />
            </div>
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Enter Amount" />
            <Input value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button type="button" className="w-full" disabled={busy === "send"} onClick={() => void sendPayment()}>
              <Send className="size-4" />
              Send via MTN
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_0.55fr_0.55fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Email, phone, reference" />
              </div>
              <select
                className="h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {label(option)}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {label(option)}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" disabled={busy === "load"} onClick={() => void loadPayments()}>
                <RefreshCw className="size-4" />
                Apply
              </Button>
            </div>
            {message ? <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{message}</p> : null}
            {providerDiagnostics.length ? (
              <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 text-xs">
                <p className="font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">Proxy diagnostics</p>
                <div className="mt-2 space-y-2">
                  {providerDiagnostics.map((attempt, index) => (
                    <div key={`${attempt.url ?? "proxy"}-${index}`} className="break-words">
                      <p className="font-semibold text-[hsl(var(--foreground))]">
                        {attempt.url ?? "Proxy endpoint"}
                        {attempt.host ? ` · Host ${attempt.host}` : ""}
                      </p>
                      <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                        {[attempt.status ? `HTTP ${attempt.status}` : attempt.code, attempt.elapsedMs ? `${attempt.elapsedMs} ms` : "", attempt.message]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Payment</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Reference</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Amount</th>
                <th className="p-4 text-right font-medium">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {snapshot.transactions.length ? (
                snapshot.transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="p-4 whitespace-nowrap text-[hsl(var(--muted-foreground))]">{dateLabel(transaction.createdAt)}</td>
                    <td className="p-4">
                      <p className="font-black capitalize">{label(transaction.type)}</p>
                      <p className="mt-1 max-w-72 truncate text-xs text-[hsl(var(--muted-foreground))]">{transaction.description}</p>
                    </td>
                    <td className="p-4">
                      <p className="max-w-52 truncate">{transaction.counterpartyEmail || transaction.userEmail || "-"}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{transaction.mobilePhone ?? transaction.referenceType ?? "-"}</p>
                    </td>
                    <td className="p-4 text-xs text-[hsl(var(--muted-foreground))]">
                      {transaction.providerReference ?? transaction.requestTransactionId ?? transaction.referenceId ?? "-"}
                    </td>
                    <td className="p-4">
                      <Badge className={transaction.status === "failed" ? "border-[hsl(var(--destructive))] text-[hsl(var(--destructive))]" : ""}>
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className={`p-4 text-right font-black ${transaction.direction === "credit" ? "text-[hsl(var(--primary))]" : ""}`}>
                      {transaction.currency === "FRW" ? money(transaction.rawAmount) : `$${Number(transaction.rawAmount ?? 0).toFixed(2)}`}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy === `view-${transaction.id}`}
                        onClick={() => void viewPayment(transaction.id)}
                      >
                        <Eye className="size-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                    No payment records match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {detail ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] p-5">
              <div>
                <Badge>{detail.bill.status}</Badge>
                <h2 className="mt-3 text-2xl font-black">{detail.bill.title}</h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{detail.bill.billNo}</p>
              </div>
              <Button type="button" size="icon" variant="outline" onClick={() => setDetail(null)} aria-label="Close payment details">
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[
                ["Name", detail.bill.buyerName],
                ["Email", detail.bill.buyerEmail],
                ["Amount", detail.bill.currency === "FRW" ? money(detail.bill.amount) : `$${Number(detail.bill.amount ?? 0).toFixed(2)}`],
                ["Method", detail.bill.paymentMethod],
                ["Status", detail.bill.status],
                ["Reference", detail.bill.reference],
                ["Mobile", detail.transaction.mobilePhone ?? "-"],
                ["Provider transaction", detail.transaction.providerTransactionId ?? "-"]
              ].map(([key, value]) => (
                <div key={key} className="rounded-md border border-[hsl(var(--border))] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{key}</p>
                  <p className="mt-2 break-words font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-md border border-[hsl(var(--border))]">
                <div className="grid grid-cols-[1fr_4rem_7rem] border-b border-[hsl(var(--border))] p-3 text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                  <span>Product / Course</span>
                  <span>Qty</span>
                  <span className="text-right">Amount</span>
                </div>
                {detail.bill.items.map((item) => (
                  <div key={`${item.name}-${item.quantity}`} className="grid grid-cols-[1fr_4rem_7rem] p-3 text-sm">
                    <span>{item.name}</span>
                    <span>{item.quantity}</span>
                    <span className="text-right">{detail.bill.currency === "FRW" ? money(item.amount) : `$${Number(item.amount ?? 0).toFixed(2)}`}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => void refreshStatus(detail.transaction.requestTransactionId)}>
                  <RefreshCw className="size-4" />
                  Refresh status
                </Button>
                <Button type="button" onClick={() => downloadBill(detail.transaction.id)}>
                  <FileText className="size-4" />
                  Download bill
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
