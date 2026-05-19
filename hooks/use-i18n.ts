"use client";

import { translate } from "@/lib/i18n";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export function useI18n() {
  const preferences = useUserPreferences();

  return {
    language: preferences.language,
    t: (key: string, fallback?: string) => translate(preferences.language, key, fallback)
  };
}
