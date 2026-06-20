import { auth } from "@/auth";
import { BriefcaseBusiness, CircleCheck, Clock3, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectMongoDB from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import WorkspaceRecord from "@/models/WorkspaceRecord";

export const dynamic = "force-dynamic";

export default async function FreelancerContractsPage() {
  const session = await auth();
  await connectMongoDB();
  const email = session?.user?.email?.toLowerCase() ?? "";
  const [contracts, transactions] = await Promise.all([
    WorkspaceRecord.find({ userEmail: email, pathname: /^\/freelancer\/contracts/ }).sort({ updatedAt: -1 }).limit(50).lean(),
    WalletTransaction.find({ userEmail: email, referenceType: "contract" }).sort({ createdAt: -1 }).limit(20).lean()
  ]);
  const completed = contracts.filter((item) => item.status === "completed").length;
  const active = contracts.filter((item) => ["active", "needs_review", "approved"].includes(item.status)).length;
  const paidFRW = transactions
    .filter((item) => item.status === "completed" && item.currency === "FRW")
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const metrics = [
    { label: "Active contracts", value: active, icon: BriefcaseBusiness },
    { label: "Completed", value: completed, icon: CircleCheck },
    { label: "Contract payments", value: `FRW ${paidFRW.toLocaleString()}`, icon: Wallet }
  ];

  return (
    <div className="content-frame space-y-5">
      <header>
        <Badge>Freelance operations</Badge>
        <h1 className="mt-2 text-3xl font-black">Contracts</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Briefs, milestones, approvals, and contract-linked payments.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-md">
            <CardContent className="p-4"><metric.icon className="size-5 text-[hsl(var(--primary))]" /><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{metric.label}</p><p className="mt-1 text-2xl font-black">{metric.value}</p></CardContent>
          </Card>
        ))}
      </section>
      <Card className="rounded-md">
        <CardHeader><CardTitle>Contract records</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {contracts.map((contract) => {
            const tags = (contract.tags ?? []) as string[];
            return (
              <article key={String(contract._id)} className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{contract.title}</h2><Badge>{contract.status.replaceAll("_", " ")}</Badge></div>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{contract.description || "Contract workspace record"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
                </div>
                <div className="text-sm md:text-right"><p className="font-black">{contract.currency} {Number(contract.amount ?? 0).toLocaleString()}</p><p className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] md:justify-end"><Clock3 className="size-3.5" />Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(contract.updatedAt))}</p></div>
              </article>
            );
          })}
          {!contracts.length ? <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-8 text-center"><BriefcaseBusiness className="mx-auto size-8 text-[hsl(var(--primary))]" /><p className="mt-3 font-bold">No contracts yet</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Contracts created from accepted freelancer requests will appear here.</p></div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
