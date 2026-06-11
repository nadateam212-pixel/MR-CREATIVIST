import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { BadgeCheck, BookOpen, BriefcaseBusiness, Mail, MessageSquare, Package, ShieldCheck, ShoppingCart, UserRound, Users } from "lucide-react";
import { auth } from "@/auth";
import { FollowButton } from "@/components/account/follow-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { databaseMediaUrl } from "@/lib/database-media";
import connectMongoDB from "@/lib/mongodb";
import Course from "@/models/Course";
import Gig from "@/models/Gig";
import Product from "@/models/Product";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Account profile"
};

type SocialAccount = {
  id: string;
  name: string;
  role?: string;
  profileImage?: string;
  isVerified?: boolean;
};

type PublicProfile = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  validatedRoles: string[];
  accountStatus?: string;
  profileImage?: string;
  bio?: string;
  isVerified?: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  followers: SocialAccount[];
  following: SocialAccount[];
  posts: ProfilePost[];
  counts: {
    courses: number;
    products: number;
    gigs: number;
  };
};

type ProfilePost = {
  id: string;
  title: string;
  type: "Course" | "Product" | "Gig";
  image?: string;
  status?: string;
  href: string;
  actionLabel: string;
};

function initials(value?: string) {
  return (value ?? "MC")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function serializeAccount(user: Record<string, unknown>): SocialAccount {
  return {
    id: String(user._id),
    name: String(user.name ?? "MR Creativist user"),
    role: typeof user.role === "string" ? user.role : undefined,
    profileImage: typeof user.profileImage === "string" ? user.profileImage : undefined,
    isVerified: Boolean(user.isVerified)
  };
}

async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;

  const session = await auth();
  if (String(session?.user?.id) === userId) redirect("/profile");

  await connectMongoDB();
  const [target, viewer, courseCount, productCount, gigCount, courses, products, gigs] = await Promise.all([
    User.findOne({ _id: userId, accountStatus: { $ne: "suspended" } })
      .select("name email role validatedRoles accountStatus profileImage bio isVerified followers following")
      .populate("followers", "name role profileImage isVerified")
      .populate("following", "name role profileImage isVerified")
      .lean(),
    session?.user?.id ? User.findById(session.user.id).select("following").lean() : null,
    Course.countDocuments({ instructorId: userId, status: { $ne: "archived" } }),
    Product.countDocuments({ sellerId: userId, status: { $ne: "archived" } }),
    Gig.countDocuments({ ownerId: userId, status: { $ne: "archived" } }),
    Course.find({ instructorId: userId, status: { $ne: "archived" } })
      .select("title slug status updatedAt")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    Product.find({ sellerId: userId, status: { $ne: "archived" } })
      .select("name slug status updatedAt")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    Gig.find({ ownerId: userId, status: { $ne: "archived" } })
      .select("title slug status updatedAt")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(8)
      .lean()
  ]);

  if (!target) return null;

  const followers = Array.isArray(target.followers) ? (target.followers as Record<string, unknown>[]).filter(Boolean) : [];
  const following = Array.isArray(target.following) ? (target.following as Record<string, unknown>[]).filter(Boolean) : [];
  const viewerFollowing = new Set(((viewer?.following ?? []) as unknown[]).map((id) => String(id)));

  return {
    id: String(target._id),
    name: String(target.name ?? "MR Creativist user"),
    email: typeof target.email === "string" ? target.email : undefined,
    role: typeof target.role === "string" ? target.role : undefined,
    validatedRoles: Array.isArray(target.validatedRoles) ? target.validatedRoles : [],
    accountStatus: typeof target.accountStatus === "string" ? target.accountStatus : undefined,
    profileImage: typeof target.profileImage === "string" ? target.profileImage : undefined,
    bio: typeof target.bio === "string" ? target.bio : undefined,
    isVerified: Boolean(target.isVerified),
    followerCount: followers.length,
    followingCount: following.length,
    postCount: courseCount + productCount + gigCount,
    isFollowing: viewerFollowing.has(String(target._id)),
    followers: followers.slice(0, 6).map(serializeAccount),
    following: following.slice(0, 6).map(serializeAccount),
    posts: [
      ...courses.map((course) => ({
        id: String(course._id ?? course.slug),
        title: String(course.title ?? "Course"),
        type: "Course" as const,
        image: databaseMediaUrl("courses", course),
        status: typeof course.status === "string" ? course.status : undefined,
        href: `/courses/${course.slug}`,
        actionLabel: "Enroll"
      })),
      ...products.map((product) => ({
        id: String(product._id ?? product.slug),
        title: String(product.name ?? "Product"),
        type: "Product" as const,
        image: databaseMediaUrl("products", product),
        status: typeof product.status === "string" ? product.status : undefined,
        href: `/marketplace/product/${product.slug}`,
        actionLabel: "Buy"
      })),
      ...gigs.map((gig) => ({
        id: String(gig._id ?? gig.slug),
        title: String(gig.title ?? "Gig"),
        type: "Gig" as const,
        image: databaseMediaUrl("gigs", gig),
        status: typeof gig.status === "string" ? gig.status : undefined,
        href: `/freelancers#${gig.slug}`,
        actionLabel: "Apply"
      }))
    ].slice(0, 12),
    counts: { courses: courseCount, products: productCount, gigs: gigCount }
  };
}

function MiniNetwork({ title, accounts }: { title: string; accounts: SocialAccount[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="size-5 text-[hsl(var(--primary))]" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {accounts.map((account) => (
          <Button key={account.id} asChild variant="outline" className="h-auto justify-start p-3">
            <Link href={`/profile/${account.id}`}>
              <span
                className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-[hsl(var(--muted))] text-xs font-black"
                style={account.profileImage ? { backgroundImage: `url(${account.profileImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
              >
                {account.profileImage ? null : initials(account.name)}
              </span>
              <span className="min-w-0 text-left">
                <span className="flex items-center gap-1">
                  <span className="truncate font-semibold">{account.name}</span>
                  {account.isVerified ? <BadgeCheck className="size-3.5 shrink-0 text-emerald-500" /> : null}
                </span>
                <span className="block truncate text-xs capitalize text-[hsl(var(--muted-foreground))]">{account.role ?? "creator"}</span>
              </span>
            </Link>
          </Button>
        ))}
        {accounts.length === 0 ? <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">No accounts yet.</p> : null}
      </CardContent>
    </Card>
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const profile = await getPublicProfile(userId);
  if (!profile) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--primary))]/12 text-2xl font-black text-[hsl(var(--primary))]"
              style={profile.profileImage ? { backgroundImage: `url(${profile.profileImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
            >
              {profile.profileImage ? null : initials(profile.name) || <UserRound className="size-9" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {profile.accountStatus ? <Badge className="border-[hsl(var(--primary))]/45 text-[hsl(var(--primary))]">{profile.accountStatus}</Badge> : null}
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
              {profile.email ? (
                <p className="mt-1 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Mail className="size-4" />
                  {profile.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <FollowButton targetUserId={profile.id} initialFollowing={profile.isFollowing} initialFollowerCount={profile.followerCount} />
            <Button asChild variant="outline">
              <Link href={`/messages/${profile.id}`}>
                <MessageSquare className="size-4" />
                Message
              </Link>
            </Button>
          </div>
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
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border border-[hsl(var(--border))] p-4 text-sm leading-7 text-[hsl(var(--muted-foreground))]">
              {profile.bio || "No bio yet."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { label: "Courses", value: profile.counts.courses, icon: BookOpen },
              { label: "Products", value: profile.counts.products, icon: Package },
              { label: "Gigs", value: profile.counts.gigs, icon: BriefcaseBusiness }
            ].map((item) => {
              const Icon = item.icon;

              return (
              <div key={item.label} className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] p-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4 text-[hsl(var(--primary))]" />
                  {item.label}
                </span>
                <span className="text-lg font-semibold">{item.value.toLocaleString()}</span>
              </div>
            );
            })}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-md border border-[hsl(var(--border))]">
              <Link href={post.href} className="block hover:bg-[hsl(var(--muted))]/45">
                <div
                  className="aspect-video bg-[hsl(var(--muted))] bg-cover bg-center"
                  style={post.image ? { backgroundImage: `url(${post.image})` } : undefined}
                />
                <div className="p-3">
                  <Badge>{post.type}</Badge>
                  <p className="mt-2 line-clamp-1 font-semibold">{post.title}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{post.status ?? "published"}</p>
                </div>
              </Link>
              <div className="border-t border-[hsl(var(--border))] p-3">
                <Button asChild size="sm" className="w-full">
                  <Link href={post.href}>
                    {post.type === "Product" ? (
                      <ShoppingCart className="size-4" />
                    ) : post.type === "Course" ? (
                      <BookOpen className="size-4" />
                    ) : (
                      <BriefcaseBusiness className="size-4" />
                    )}
                    {post.actionLabel}
                  </Link>
                </Button>
              </div>
            </article>
          ))}
          {profile.posts.length === 0 ? (
            <p className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
              No posts yet.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <MiniNetwork title="Followers" accounts={profile.followers} />
        <MiniNetwork title="Following" accounts={profile.following} />
      </section>
    </div>
  );
}
