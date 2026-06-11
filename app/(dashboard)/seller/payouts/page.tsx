import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EarningsReferralsDashboard } from "@/components/platform/earnings-referrals-dashboard";
import { getEarningsReferralView } from "@/lib/earnings-referrals";

export const metadata: Metadata = {
  title: "Seller Earnings"
};

export default async function SellerPayoutsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getEarningsReferralView(session.user);
  return <EarningsReferralsDashboard wallet={data.wallet} referral={data.referral} invites={data.invites} variant="earnings" />;
}
