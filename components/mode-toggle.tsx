"use client";

import { Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { getNextThemeId, getTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const { cycleTheme, theme, themeId } = useTheme();
  const nextTheme = getTheme(getNextThemeId(themeId));

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Switch theme. Current theme is ${theme.name}. Next theme is ${nextTheme.name}.`}
      title={`Theme: ${theme.name}. Next: ${nextTheme.name}`}
      onClick={cycleTheme}
      className={cn(className)}
    >
      <Palette className="size-4" />
    </Button>
  );
}
