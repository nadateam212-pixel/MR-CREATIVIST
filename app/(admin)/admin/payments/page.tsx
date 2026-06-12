import type { Metadata } from "next";
import { AdminPaymentsConsole } from "@/components/admin/admin-payments-console";
import { getAdminFinanceSnapshot, getAdminIntouchBalance } from "@/lib/platform-ledger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Payments"
};

export default async function AdminPaymentsPage() {
  const [snapshot, providerBalance] = await Promise.all([
    getAdminFinanceSnapshot(),
    getAdminIntouchBalance().catch(() => null)
  ]);
  const initialProviderBalance =
    providerBalance?.ok === false ? null : Number(providerBalance?.balance ?? NaN);

  return (
    <AdminPaymentsConsole
      initialSnapshot={snapshot}
      initialProviderBalance={Number.isFinite(initialProviderBalance) ? initialProviderBalance : null}
    />
  );
}
