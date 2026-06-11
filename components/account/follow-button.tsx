"use client";

import { useState } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing?: boolean;
  initialFollowerCount?: number;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
  onChanged?: (state: { following: boolean; followerCount: number }) => void;
};

export function FollowButton({
  targetUserId,
  initialFollowing = false,
  initialFollowerCount = 0,
  size = "default",
  variant,
  className,
  onChanged
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [busy, setBusy] = useState(false);

  async function toggleFollow() {
    setBusy(true);
    try {
      const response = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: following ? "unfollow" : "follow" })
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Follow action failed.");

      const nextState = {
        following: Boolean(payload.following),
        followerCount: Number(payload.followerCount ?? followerCount)
      };
      setFollowing(nextState.following);
      setFollowerCount(nextState.followerCount);
      onChanged?.(nextState);
      toast.success(nextState.following ? "Account followed." : "Account unfollowed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Follow action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant ?? (following ? "outline" : "default")}
      className={className}
      disabled={busy}
      onClick={() => void toggleFollow()}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : following ? <UserMinus className="size-4" /> : <UserPlus className="size-4" />}
      {following ? "Unfollow" : "Follow"}
    </Button>
  );
}
