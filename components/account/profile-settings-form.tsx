"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type EditableProfile = {
  name: string;
  email?: string | null;
  phone?: string;
  location?: string;
  bio?: string;
  profileImage?: string;
  role?: string;
};

export function ProfileSettingsForm({ initialProfile }: { initialProfile: EditableProfile }) {
  const { update } = useSession();
  const [form, setForm] = useState({
    name: initialProfile.name ?? "",
    phone: initialProfile.phone ?? "",
    location: initialProfile.location ?? "",
    bio: initialProfile.bio ?? "",
    profileImage: initialProfile.profileImage ?? ""
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadProfileImage(file: File | null) {
    if (!file) return;

    setUploading(true);
    setMessage("Uploading profile picture...");

    try {
      const data = new FormData();
      data.set("file", file);
      data.set("kind", "image");
      data.set("ownerType", "profile");
      data.set("metadata", JSON.stringify({ module: "profile-settings" }));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: data
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Profile picture upload failed.");

      const imageUrl = payload.asset?.secureUrl ?? payload.asset?.url;
      if (!imageUrl) throw new Error("Upload did not return a usable image URL.");

      setField("profileImage", imageUrl);
      setMessage("Profile picture uploaded. Save changes to apply it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile picture upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving profile...");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Profile save failed.");

      await update({
        name: payload.name,
        image: payload.profileImage
      });
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <CardDescription>Change your public name, contact number, location, bio and profile picture.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={submit}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
              {form.profileImage ? (
                <img src={form.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="size-9 text-[hsl(var(--muted-foreground))]" />
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <Input value={form.profileImage} onChange={(event) => setField("profileImage", event.target.value)} placeholder="Profile picture URL" />
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[hsl(var(--border))] px-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/40">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {uploading ? "Uploading picture..." : "Upload profile picture"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="sr-only"
                  onChange={(event) => void uploadProfileImage(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Name
              <Input value={form.name} onChange={(event) => setField("name", event.target.value)} required minLength={2} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Email
              <Input value={initialProfile.email ?? ""} disabled />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Phone number
              <Input value={form.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="+250..." />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Location
              <Input value={form.location} onChange={(event) => setField("location", event.target.value)} placeholder="Kigali, Rwanda" />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Bio
            <textarea
              value={form.bio}
              onChange={(event) => setField("bio", event.target.value)}
              className="min-h-28 rounded-md border border-[hsl(var(--border))] bg-transparent p-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              placeholder="Tell clients, sellers and learners who you are."
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving..." : "Save profile"}
            </Button>
            {message ? <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
