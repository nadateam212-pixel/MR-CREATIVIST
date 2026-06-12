import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Mail, MapPin, Phone, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectMongoDB from "@/lib/mongodb";
import Enrollment from "@/models/Enrollment";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export const dynamic = "force-dynamic";

function formatDate(value?: Date | string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  await connectMongoDB();
  const user = await User.findById(userId).lean();
  if (!user) notFound();

  const [enrollments, orders, transactions, walletRows] = await Promise.all([
    Enrollment.find({ $or: [{ userId: user._id }, { learnerEmail: user.email }] }).sort({ createdAt: -1 }).limit(6).populate("courseId", "title slug").lean(),
    Order.find({ $or: [{ buyerId: user._id }, { buyerEmail: user.email }] }).sort({ createdAt: -1 }).limit(6).lean(),
    WalletTransaction.find({ $or: [{ userId: user._id }, { userEmail: user.email }] }).sort({ createdAt: -1 }).limit(8).lean(),
    WalletTransaction.aggregate([
      { $match: { userEmail: user.email, status: "completed" } },
      { $group: { _id: { currency: "$currency", direction: "$direction" }, total: { $sum: "$amount" } } }
    ])
  ]);

  const wallet = (currency: "FRW" | "USD") => {
    const credit = Number(walletRows.find((row) => row._id.currency === currency && row._id.direction === "credit")?.total ?? 0);
    const debit = Number(walletRows.find((row) => row._id.currency === currency && row._id.direction === "debit")?.total ?? 0);
    return Math.max(0, credit - debit);
  };

  const metrics = [
    { label: "Enrollments", value: enrollments.length, icon: BookOpen },
    { label: "Orders", value: orders.length, icon: ReceiptText },
    { label: "FRW wallet", value: `FRW ${wallet("FRW").toLocaleString()}`, icon: Wallet },
    { label: "USD wallet", value: new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(wallet("USD")), icon: Wallet }
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge>{user.accountStatus ?? "active"}</Badge>
          <h1 className="mt-2 text-3xl font-black">{user.name}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Account created {formatDate(user.createdAt)}</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin/users"><ArrowLeft className="size-4" />Back to users</Link></Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <Card key={metric.label} className="rounded-md"><CardContent className="p-4"><metric.icon className="size-5 text-[hsl(var(--primary))]" /><p className="mt-3 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{metric.label}</p><p className="mt-1 text-2xl font-black">{metric.value}</p></CardContent></Card>)}
      </section>

      <section className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Card className="h-max rounded-md">
          <CardHeader><CardTitle>Account profile</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid size-20 place-items-center overflow-hidden rounded-md bg-[hsl(var(--muted))] text-2xl font-black" style={user.profileImage ? { backgroundImage: `url(${user.profileImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}>{user.profileImage ? null : String(user.name ?? "MC").slice(0, 2).toUpperCase()}</div>
            <p className="flex items-center gap-2"><Mail className="size-4 text-[hsl(var(--primary))]" />{user.email}</p>
            <p className="flex items-center gap-2"><Phone className="size-4 text-[hsl(var(--primary))]" />{user.phone || "No phone"}</p>
            <p className="flex items-center gap-2"><MapPin className="size-4 text-[hsl(var(--primary))]" />{user.location || "No location"}</p>
            <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-[hsl(var(--primary))]" />{user.isVerified ? "Verified" : "Verification pending"}</p>
            <div className="flex flex-wrap gap-2">{(user.validatedRoles ?? [user.role]).map((role: string) => <Badge key={role}>{role}</Badge>)}</div>
            {user.bio ? <p className="leading-6 text-[hsl(var(--muted-foreground))]">{user.bio}</p> : null}
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Last login: {formatDate(user.lastLoginAt)}</p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="overflow-hidden rounded-md">
            <CardHeader><CardTitle>Recent wallet activity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[hsl(var(--border))]">
                {transactions.map((item) => <div key={String(item._id)} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[1fr_auto_auto]"><div><p className="font-bold">{item.description}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(item.createdAt)}</p></div><Badge>{item.status}</Badge><p className={item.direction === "credit" ? "font-black text-emerald-600" : "font-black text-rose-600"}>{item.direction === "credit" ? "+" : "-"}{item.currency} {Number(item.amount).toLocaleString()}</p></div>)}
                {!transactions.length ? <p className="p-6 text-sm text-[hsl(var(--muted-foreground))]">No wallet activity.</p> : null}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="rounded-md"><CardHeader><CardTitle>Courses</CardTitle></CardHeader><CardContent className="space-y-3">{enrollments.map((item) => <div key={String(item._id)} className="rounded-md border border-[hsl(var(--border))] p-3"><p className="font-bold">{item.courseId?.title ?? "Course"}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.progressPercent}% complete - {item.status}</p></div>)}{!enrollments.length ? <p className="text-sm text-[hsl(var(--muted-foreground))]">No enrollments.</p> : null}</CardContent></Card>
            <Card className="rounded-md"><CardHeader><CardTitle>Orders</CardTitle></CardHeader><CardContent className="space-y-3">{orders.map((item) => <div key={String(item._id)} className="rounded-md border border-[hsl(var(--border))] p-3"><div className="flex items-center justify-between gap-2"><p className="font-bold">{item.items?.[0]?.name ?? "Marketplace order"}</p><Badge>{item.status}</Badge></div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.currency} {Number(item.total).toLocaleString()} - {formatDate(item.createdAt)}</p></div>)}{!orders.length ? <p className="text-sm text-[hsl(var(--muted-foreground))]">No orders.</p> : null}</CardContent></Card>
          </div>
        </div>
      </section>
    </div>
  );
}
