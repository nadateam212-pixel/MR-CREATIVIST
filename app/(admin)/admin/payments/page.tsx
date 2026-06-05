import type { Metadata } from "next";
import { AdminPaymentsConsole } from "@/components/admin/admin-payments-console";
import { getAdminFinanceSnapshot } from "@/lib/platform-ledger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Payments"
};

export default async function AdminPaymentsPage() {
  const snapshot = await getAdminFinanceSnapshot();

  return <AdminPaymentsConsole initialSnapshot={snapshot} />;
}
