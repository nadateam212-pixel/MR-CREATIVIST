import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, Download, Mail, MapPin, MessageSquare, ReceiptText, Settings, ShieldCheck, Sparkles, UserRound, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectMongoDB, { hasMongoConfig } from "@/lib/mongodb";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Profile"
};

type ProfileView = {
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
};

async function getProfile(): Promise<ProfileView> {
  const session = await auth();
  const fallback: ProfileView = {
    name: session?.user?.name ?? "MR Creativist user",
    email: session?.user?.email ?? "",
    role: session?.user?.role ?? "client",
    validatedRoles: session?.user?.validatedRoles ?? [],
    accountStatus: session?.user?.accountStatus ?? "active",
    profileImage: session?.user?.image ?? undefined
  };

  if (!session?.user?.id || !hasMongoConfig()) return fallback;

  try {
    await connectMongoDB();
    const user = await User.findById(session.user.id)
      .select("name email role validatedRoles accountStatus profileImage phone location bio isVerified")
      .lean();

    if (!user) return fallback;

    return {
      name: user.name ?? fallback.name,
      email: user.email ?? fallback.email,
      role: user.role ?? fallback.role,
      validatedRoles: user.validatedRoles ?? fallback.validatedRoles,
      accountStatus: user.accountStatus ?? fallback.accountStatus,
      profileImage: user.profileImage ?? fallback.profileImage,
      phone: user.phone ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
      isVerified: Boolean(user.isVerified)
    };
  } catch {
    return fallback;
  }
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
    { label: "Dashboard", href: "/dashboard", icon: BookOpen },
    { label: "MrC. Studio", href: "/studio", icon: Sparkles },
    { label: "Orders", href: "/dashboard/orders", icon: ReceiptText },
    { label: "Downloads", href: "/dashboard/downloads", icon: Download },
    { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Settings", href: "/settings", icon: Settings }
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
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">{profile.name}</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Mail className="size-4" />
                {profile.email || "No email saved"}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/settings">
              <Settings className="size-4" />
              Edit profile
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {[
              ["Primary role", profile.role],
              ["Phone", profile.phone || "Not set"],
              ["Location", profile.location || "Not set"]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 rounded-md border border-[hsl(var(--border))] p-3">
                <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
                <span className="text-right font-semibold">{value}</span>
              </div>
            ))}
            <div className="rounded-md border border-[hsl(var(--border))] p-3">
              <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                <MapPin className="size-4" />
                Validated roles
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.validatedRoles.length ? profile.validatedRoles : [profile.role]).map((role) => (
                  <Badge key={role}>{role}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border border-[hsl(var(--border))] p-4 text-sm leading-7 text-[hsl(var(--muted-foreground))]">
              {profile.bio || "Add a short bio in settings so learners, clients, sellers, and admins understand your public identity."}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="size-5 text-[hsl(var(--primary))]" />
            <CardTitle>Profile tools</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Button key={tool.href} asChild variant="outline" className="h-auto justify-start p-4">
              <Link href={tool.href}>
                <tool.icon className="size-5 text-[hsl(var(--primary))]" />
                <span>{tool.label}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
