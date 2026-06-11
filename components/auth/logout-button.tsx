"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = Omit<ButtonProps, "type" | "onClick"> & {
  children?: React.ReactNode;
  iconClassName?: string;
  onBeforeLogout?: () => void;
};

export function LogoutButton({
  children = "Log out",
  className,
  iconClassName,
  onBeforeLogout,
  variant = "outline",
  ...props
}: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) return;

    onBeforeLogout?.();
    setPending(true);

    try {
      await signOut({ redirect: false });
      window.location.assign(window.location.origin);
    } catch {
      window.location.assign(window.location.origin);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={cn("justify-start", className)}
      onClick={handleLogout}
      disabled={pending || props.disabled}
      {...props}
    >
      <LogOut className={cn("size-4", iconClassName)} />
      {pending ? "Logging out..." : children}
    </Button>
  );
}
