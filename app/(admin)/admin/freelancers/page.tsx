import type { Metadata } from "next";
import { AdminPeopleManager, type AdminPersonRow } from "@/components/admin/admin-people-manager";
import connectMongoDB from "@/lib/mongodb";
import FreelancerProfile from "@/models/FreelancerProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Freelancers"
};

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

type AdminUserDoc = {
  _id: string;
  name: string;
  email: string;
  accountStatus?: "active" | "review" | "suspended";
};

type FreelancerDoc = {
  _id: string;
  userId?: string;
  slug: string;
  name: string;
  role: string;
  specialty: string;
  status?: "draft" | "published" | "archived";
  rating?: number;
  completedJobs?: number;
};

export default async function AdminFreelancersPage() {
  await connectMongoDB();

  const [profiles, users] = clean(
    await Promise.all([
      FreelancerProfile.find({}).sort({ rating: -1, completedJobs: -1, updatedAt: -1 }).limit(120).lean(),
      User.find({ $or: [{ role: "freelancer" }, { validatedRoles: "freelancer" }] })
        .select("name email role accountStatus validatedRoles")
        .sort({ createdAt: -1 })
        .limit(120)
        .lean()
    ])
  ) as [FreelancerDoc[], AdminUserDoc[]];

  const userById = new Map(users.map((user) => [String(user._id), user]));
  const profileUserIds = new Set(profiles.map((profile) => String(profile.userId ?? "")).filter(Boolean));

  const profileRows: AdminPersonRow[] = profiles.map((profile) => {
      const user = profile.userId ? userById.get(String(profile.userId)) : null;

      return {
        id: `profile:${profile.slug ?? profile._id}`,
        userId: profile.userId ? String(profile.userId) : undefined,
        name: profile.name,
        email: user?.email,
        role: "freelancer",
        title: `${profile.role} - ${profile.specialty}`,
        status: profile.status ?? "published",
        metric: `${profile.completedJobs ?? 0} completed jobs, ${profile.rating ?? 0} rating`,
        href: profile.userId ? `/admin/users/${profile.userId}` : undefined,
        publicHref: "/freelancers",
        archivePath: `/api/freelancers/${profile.slug ?? profile._id}`
      };
    });

  const userRows: AdminPersonRow[] = users
    .filter((user) => !profileUserIds.has(String(user._id)))
    .map((user) => ({
      id: `user:${user._id}`,
      userId: String(user._id),
      name: user.name,
      email: user.email,
      role: "freelancer",
      title: "Validated freelancer without a public profile",
      status: user.accountStatus ?? "active",
      metric: "Profile not published yet",
      href: `/admin/users/${user._id}`,
      publicHref: "/freelancers"
    }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Freelancer control</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">List and manage freelancers</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Review freelancer profiles, message talent, block unsafe accounts, share public profiles and archive outdated listings.
        </p>
      </div>
      <AdminPeopleManager title="Freelancer records" rows={[...profileRows, ...userRows]} emptyMessage="No freelancers are registered yet." />
    </div>
  );
}
