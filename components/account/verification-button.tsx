"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function VerificationButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function verifyAccount() {
    setBusy(true);
    try {
      const response = await fetch("/api/profile/verify", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Verification payment failed.");

      toast.success(payload.message ?? "Account verified.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" className={className} disabled={busy} onClick={() => void verifyAccount()}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
      Verify account - FRW 5,000 / $3.99
    </Button>
  );
}
