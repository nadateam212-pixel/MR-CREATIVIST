"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  defaultTheme,
  getNextThemeId,
  getTheme,
  isDarkTheme,
  isThemeId,
  themeStorageKey,
  themes,
  type ThemeId,
  type ThemeOption
} from "@/lib/themes";

interface ThemeContextValue {
  cycleTheme: () => void;
  setThemeId: (themeId: ThemeId) => void;
  theme: ThemeOption;
  themeId: ThemeId;
  themes: readonly ThemeOption[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialThemeId(): ThemeId {
  return defaultTheme.id;
}

function applyTheme(themeId: ThemeId) {
  const root = document.documentElement;
  const dark = isDarkTheme(themeId);

  root.dataset.theme = themeId;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(getInitialThemeId);
  const [ready, setReady] = useState(false);

  const theme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);

    window.queueMicrotask(() => {
      if (isThemeId(stored)) {
        setThemeIdState(stored);
      }

      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;

    applyTheme(themeId);
    window.localStorage.setItem(themeStorageKey, themeId);
  }, [ready, themeId]);

  function setThemeId(nextThemeId: ThemeId) {
    setThemeIdState(nextThemeId);
  }

  function cycleTheme() {
    setThemeIdState((currentThemeId) => getNextThemeId(currentThemeId));
  }

  return (
    <ThemeContext.Provider value={{ cycleTheme, setThemeId, theme, themeId, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return value;
}
