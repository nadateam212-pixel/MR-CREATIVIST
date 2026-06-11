import type { Session } from "next-auth";
import connectMongoDB from "@/lib/mongodb";
import { getRoleDashboardData } from "@/lib/platform-ledger";
import User from "@/models/User";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function fallbackReferral(email?: string | null) {
  const local = String(email ?? "user")
    .split("@")[0]
    ?.replace(/[^a-z0-9]+/gi, "")
    .slice(0, 8)
    .toUpperCase() || "MRC";

  return {
    code: `MRC-${local}`,
    commissionRate: 0.05,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    unpaidCommission: 0
  };
}

export async function getEarningsReferralView(user: Session["user"]) {
  const live = await getRoleDashboardData("user", user);
  await connectMongoDB();

  const inviteFilter = [];
  if (user.email) inviteFilter.push({ referredByEmail: user.email.toLowerCase() });
  if (user.id) inviteFilter.push({ referredByUserId: user.id });

  const invites = inviteFilter.length
    ? await User.find({ $or: inviteFilter })
        .select("name email role accountStatus isVerified createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
    : [];

  return clean({
    wallet: live.wallet,
    referral: live.referral
      ? {
          code: live.referral.code,
          commissionRate: Number(live.referral.commissionRate ?? 0.05),
          clicks: Number(live.referral.clicks ?? 0),
          conversions: Number(live.referral.conversions ?? 0),
          revenue: Number(live.referral.revenue ?? 0),
          unpaidCommission: Number(live.referral.unpaidCommission ?? 0)
        }
      : fallbackReferral(user.email),
    invites: invites.map((invite) => ({
      id: String(invite._id),
      name: invite.name ?? "MR Creativist user",
      email: invite.email ?? "",
      role: invite.role ?? "client",
      accountStatus: invite.accountStatus ?? "active",
      isVerified: Boolean(invite.isVerified),
      createdAt: invite.createdAt
    }))
  });
}
