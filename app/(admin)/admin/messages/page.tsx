import type { Metadata } from "next";
import { MessageCenter } from "@/components/platform/message-center";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Messages"
};

export default function AdminMessagesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Admin messages</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Read and reply to users</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Use private platform conversations to answer sellers, instructors, freelancers, students and support requests.
        </p>
      </div>
      <MessageCenter />
    </div>
  );
}
