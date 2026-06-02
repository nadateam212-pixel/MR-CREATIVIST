"use client";

import { Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { setThemeId, themeId, themes } = useTheme();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {themes.map((theme) => {
        const active = theme.id === themeId;

        return (
          <Button
            key={theme.id}
            type="button"
            variant={active ? "default" : "outline"}
            onClick={() => setThemeId(theme.id)}
            className={cn("justify-between", active ? "shadow-sm" : "bg-[hsl(var(--card))]")}
          >
            <span className="truncate">{theme.name}</span>
            {active ? <Check className="size-4" /> : null}
          </Button>
        );
      })}
    </div>
  );
}
