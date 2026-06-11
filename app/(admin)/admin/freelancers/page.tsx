import type { Metadata } from "next";
import { AdminContentTable, type AdminContentRow } from "@/components/admin/admin-content-table";
import { AdminPeopleManager, type AdminPersonRow } from "@/components/admin/admin-people-manager";
import connectMongoDB from "@/lib/mongodb";
import FreelancerProfile from "@/models/FreelancerProfile";
import Gig from "@/models/Gig";
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
  status?: "draft" | "submitted" | "changes_requested" | "approved" | "published" | "archived";
  isVerified?: boolean;
  rating?: number;
  completedJobs?: number;
};

type GigDoc = {
  _id: string;
  ownerId?: string;
  slug: string;
  title: string;
  category: string;
  image?: string;
  packageName?: string;
  status?: "draft" | "submitted" | "changes_requested" | "approved" | "published" | "archived";
  isVerified?: boolean;
  ownerName?: string;
};

export default async function AdminFreelancersPage() {
  await connectMongoDB();

  const [profiles, users, gigs] = clean(
    await Promise.all([
      FreelancerProfile.find({}).sort({ rating: -1, completedJobs: -1, updatedAt: -1 }).limit(120).lean(),
      User.find({ $or: [{ role: "freelancer" }, { validatedRoles: "freelancer" }] })
        .select("name email role accountStatus validatedRoles")
        .sort({ createdAt: -1 })
        .limit(120)
        .lean(),
      Gig.find({}).sort({ updatedAt: -1 }).limit(160).lean()
    ])
  ) as [FreelancerDoc[], AdminUserDoc[], GigDoc[]];

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
        isVerified: Boolean(profile.isVerified),
        metric: `${profile.completedJobs ?? 0} completed jobs, ${profile.rating ?? 0} rating`,
        href: profile.userId ? `/admin/users/${profile.userId}` : undefined,
        publicHref: "/freelancers",
        updatePath: `/api/freelancers/${profile.slug ?? profile._id}`,
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

  const gigRows: AdminContentRow[] = gigs.map((gig) => ({
    id: `gig:${gig.slug ?? gig._id}`,
    title: gig.title,
    subtitle: `${gig.ownerName ?? "Freelancer"} - ${gig.packageName ?? gig.category}`,
    image: gig.image,
    kind: "Gig",
    status: gig.status ?? "draft",
    isVerified: Boolean(gig.isVerified),
    href: "/freelancers",
    apiPath: `/api/gigs/${gig.slug ?? gig._id}`,
    updateMethod: "PUT",
    editFields: [
      { key: "title", label: "Title", value: gig.title },
      { key: "category", label: "Category", value: gig.category },
      {
        key: "status",
        label: "Status",
        value: gig.status ?? "draft",
        options: ["draft", "submitted", "changes_requested", "approved", "published", "archived"]
      }
    ],
    statusActions: [
      { label: "Approve", status: "approved" },
      { label: "Publish", status: "published" },
      { label: "Request changes", status: "changes_requested" },
      { label: "Verify badge", patch: { isVerified: true } }
    ]
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
      <AdminContentTable title="Gig review table" rows={gigRows} emptyMessage="No gigs have been submitted yet." />
    </div>
  );
}
