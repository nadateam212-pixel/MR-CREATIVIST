import type { Metadata } from "next";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { ProfileSettingsForm, type EditableProfile } from "@/components/account/profile-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageCurrencySettings } from "@/components/layout/language-currency-settings";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemePicker } from "@/components/theme-picker";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Settings"
};

async function getEditableProfile(session: Session | null): Promise<EditableProfile> {
  const fallback = {
    name: session?.user.name ?? "",
    email: session?.user.email,
    profileImage: session?.user.image ?? "",
    role: session?.user.role
  };

  if (!session?.user?.id) return fallback;

  try {
    await connectMongoDB();
    const user = await User.findById(session.user.id).select("name email phone location bio profileImage role").lean();

    if (!user) return fallback;

    return {
      name: user.name ?? fallback.name,
      email: user.email ?? fallback.email,
      phone: user.phone ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
      profileImage: user.profileImage ?? "",
      role: user.role ?? fallback.role
    };
  } catch {
    return fallback;
  }
}

export default async function SettingsPage() {
  const session = await auth();
  const profile = await getEditableProfile(session);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Account and workspace preferences.</p>
      </div>

      <ProfileSettingsForm initialProfile={profile} />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your current account information.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[hsl(var(--muted-foreground))]">Name</span>
            <span className="font-medium">{profile.name || "Not set"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[hsl(var(--muted-foreground))]">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[hsl(var(--muted-foreground))]">Role</span>
            <span className="font-medium">{profile.role}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose from 12 themes or use the theme icon to move to the next one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModeToggle />
          <ThemePicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language and currency</CardTitle>
          <CardDescription>Default language is English. Currency starts in FRW for Rwanda and USD for other locations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <LanguageCurrencySettings />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            USD and FRW display settings are saved on this device. Payments and invoices should still use the saved order currency.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
