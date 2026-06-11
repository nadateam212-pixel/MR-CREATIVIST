import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Mail, Phone, Settings, ShieldCheck, UserRound, Users } from "lucide-react";
import { auth } from "@/auth";
import { ProfileToolsToggle, ReferralCopyBox } from "@/components/account/profile-tools-toggle";
import { VerificationButton } from "@/components/account/verification-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { databaseMediaUrl } from "@/lib/database-media";
import connectMongoDB, { hasMongoConfig } from "@/lib/mongodb";
import Course from "@/models/Course";
import Gig from "@/models/Gig";
import Product from "@/models/Product";
import ReferralProfile from "@/models/ReferralProfile";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Profile"
};

type ProfileView = {
  userId?: string;
  name: string;
  email: string;
  role: string;
  validatedRoles: string[];
  accountStatus: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
  isVerified?: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  referralCode: string;
  posts: ProfilePost[];
  followers: SocialAccount[];
  following: SocialAccount[];
};

type ProfilePost = {
  id: string;
  title: string;
  type: "Course" | "Product" | "Gig";
  image?: string;
  status?: string;
  href: string;
};

type SocialAccount = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  profileImage?: string;
  isVerified?: boolean;
};

function serializeSocialAccount(user: Record<string, unknown>): SocialAccount {
  return {
    id: String(user._id),
    name: String(user.name ?? user.email ?? "MR Creativist user"),
    email: typeof user.email === "string" ? user.email : undefined,
    role: typeof user.role === "string" ? user.role : undefined,
    profileImage: typeof user.profileImage === "string" ? user.profileImage : undefined,
    isVerified: Boolean(user.isVerified)
  };
}

function fallbackReferralCode(email?: string) {
  const local = String(email ?? "user").split("@")[0]?.replace(/[^a-z0-9]+/gi, "").slice(0, 8).toUpperCase() || "USER";
  return `MRC-${local}`;
}

async function getProfile(): Promise<ProfileView> {
  const session = await auth();
  const fallback: ProfileView = {
    userId: session?.user?.id,
    name: session?.user?.name ?? "MR Creativist user",
    email: session?.user?.email ?? "",
    role: session?.user?.role ?? "client",
    validatedRoles: session?.user?.validatedRoles ?? [],
    accountStatus: session?.user?.accountStatus ?? "active",
    profileImage: session?.user?.image ?? undefined,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    referralCode: fallbackReferralCode(session?.user?.email ?? undefined),
    posts: [],
    followers: [],
    following: []
  };

  if (!session?.user?.id || !hasMongoConfig()) return fallback;

  try {
    await connectMongoDB();
    const user = await User.findById(session.user.id)
      .select("name email role validatedRoles accountStatus profileImage phone location bio isVerified followers following")
      .populate("followers", "name email role profileImage isVerified")
      .populate("following", "name email role profileImage isVerified")
      .lean();

    if (!user) return fallback;
    const [courseCount, productCount, gigCount, courses, products, gigs, referral] = await Promise.all([
      Course.countDocuments({ instructorId: session.user.id, status: { $ne: "archived" } }),
      Product.countDocuments({ sellerId: session.user.id, status: { $ne: "archived" } }),
      Gig.countDocuments({ ownerId: session.user.id, status: { $ne: "archived" } }),
      Course.find({ instructorId: session.user.id, status: { $ne: "archived" } }).select("title slug status updatedAt").sort({ updatedAt: -1 }).limit(6).lean(),
      Product.find({ sellerId: session.user.id, status: { $ne: "archived" } }).select("name slug status updatedAt").sort({ updatedAt: -1 }).limit(6).lean(),
      Gig.find({ ownerId: session.user.id, status: { $ne: "archived" } }).select("title slug status updatedAt").sort({ updatedAt: -1 }).limit(6).lean(),
      ReferralProfile.findOne({ userEmail: user.email }).select("code").lean()
    ]);
    const followers = Array.isArray(user.followers) ? (user.followers as Record<string, unknown>[]).filter((item) => item && typeof item === "object") : [];
    const following = Array.isArray(user.following) ? (user.following as Record<string, unknown>[]).filter((item) => item && typeof item === "object") : [];

    return {
      userId: String(user._id),
      name: user.name ?? fallback.name,
      email: user.email ?? fallback.email,
      role: user.role ?? fallback.role,
      validatedRoles: user.validatedRoles ?? fallback.validatedRoles,
      accountStatus: user.accountStatus ?? fallback.accountStatus,
      profileImage: user.profileImage ?? fallback.profileImage,
      phone: user.phone ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
      isVerified: Boolean(user.isVerified),
      followerCount: followers.length,
      followingCount: following.length,
      postCount: courseCount + productCount + gigCount,
      referralCode: referral?.code ?? fallbackReferralCode(user.email),
      posts: [
        ...courses.map((course) => ({
          id: String(course._id ?? course.slug),
          title: String(course.title ?? "Course"),
          type: "Course" as const,
          image: databaseMediaUrl("courses", course),
          status: typeof course.status === "string" ? course.status : undefined,
          href: `/courses/${course.slug}`
        })),
        ...products.map((product) => ({
          id: String(product._id ?? product.slug),
          title: String(product.name ?? "Product"),
          type: "Product" as const,
          image: databaseMediaUrl("products", product),
          status: typeof product.status === "string" ? product.status : undefined,
          href: `/marketplace/product/${product.slug}`
        })),
        ...gigs.map((gig) => ({
          id: String(gig._id ?? gig.slug),
          title: String(gig.title ?? "Gig"),
          type: "Gig" as const,
          image: databaseMediaUrl("gigs", gig),
          status: typeof gig.status === "string" ? gig.status : undefined,
          href: "/freelancers"
        }))
      ].slice(0, 12),
      followers: followers.slice(0, 8).map(serializeSocialAccount),
      following: following.slice(0, 8).map(serializeSocialAccount)
    };
  } catch {
    return fallback;
  }
}

function SocialList({ title, accounts }: { title: string; accounts: SocialAccount[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="size-5 text-[hsl(var(--primary))]" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <Button key={account.id} asChild variant="outline" className="h-auto justify-start p-3">
            <Link href={`/profile/${account.id}`} className="min-w-0">
              <span
                className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-[hsl(var(--muted))] text-xs font-black"
                style={account.profileImage ? { backgroundImage: `url(${account.profileImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
              >
                {account.profileImage ? null : account.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 text-left">
                <span className="flex items-center gap-1">
                  <span className="truncate font-semibold">{account.name}</span>
                  {account.isVerified ? <BadgeCheck className="size-3.5 shrink-0 text-emerald-500" /> : null}
                </span>
                <span className="block truncate text-xs capitalize text-[hsl(var(--muted-foreground))]">{account.role ?? account.email ?? "creator"}</span>
              </span>
            </Link>
          </Button>
        ))}
        {accounts.length === 0 ? (
          <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
            No accounts yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function ProfilePage() {
  const profile = await getProfile();
  const initials = profile.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const tools = [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "MrC. Studio", href: "/studio", icon: "studio" },
    { label: "Orders", href: "/dashboard/orders", icon: "orders" },
    { label: "Downloads", href: "/dashboard/downloads", icon: "downloads" },
    { label: "Wallet", href: "/dashboard/wallet", icon: "wallet" },
    { label: "Messages", href: "/messages", icon: "messages" },
    { label: "Settings", href: "/settings", icon: "settings" }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--primary))]/12 text-2xl font-black text-[hsl(var(--primary))]"
              style={profile.profileImage ? { backgroundImage: `url(${profile.profileImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
            >
              {profile.profileImage ? null : initials || <UserRound className="size-9" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[hsl(var(--primary))]/45 text-[hsl(var(--primary))]">{profile.accountStatus}</Badge>
                {profile.isVerified ? (
                  <Badge className="border-emerald-500/45 text-emerald-600">
                    <ShieldCheck className="mr-1 size-3" />
                    Verified
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-3 flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight">
                {profile.name}
                {profile.isVerified ? <BadgeCheck className="size-5 text-emerald-500" /> : null}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Mail className="size-4" />
                {profile.email || "No email saved"}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                {profile.phone ? (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4" />
                    {profile.phone}
                  </span>
                ) : null}
                {profile.bio ? <span className="line-clamp-1 max-w-xl">{profile.bio}</span> : null}
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href="/settings">
              <Settings className="size-4" />
              Edit profile
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:max-w-xl">
          {[
            ["Followers", profile.followerCount],
            ["Following", profile.followingCount],
            ["Posts", profile.postCount]
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
              <p className="text-2xl font-semibold">{Number(value).toLocaleString()}</p>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
          ))}
        </div>
        {!profile.isVerified ? (
          <div className="mt-4">
            <VerificationButton />
          </div>
        ) : null}
        <div className="mt-4 max-w-xl">
          <ReferralCopyBox code={profile.referralCode} />
        </div>
      </section>

      <ProfileToolsToggle tools={tools} />

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.posts.map((post) => (
            <Link key={post.id} href={post.href} className="overflow-hidden rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/45">
              <div
                className="aspect-video bg-[hsl(var(--muted))] bg-cover bg-center"
                style={post.image ? { backgroundImage: `url(${post.image})` } : undefined}
              />
              <div className="p-3">
                <Badge>{post.type}</Badge>
                <p className="mt-2 line-clamp-1 font-semibold">{post.title}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{post.status ?? "draft"}</p>
              </div>
            </Link>
          ))}
          {profile.posts.length === 0 ? (
            <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">No posts yet.</p>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <SocialList title="Followers" accounts={profile.followers} />
        <SocialList title="Following" accounts={profile.following} />
      </section>
    </div>
  );
}
