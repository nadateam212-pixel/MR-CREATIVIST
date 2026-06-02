export type ThemeId =
  | "light"
  | "dark"
  | "kigaliNight"
  | "rwandaSunrise"
  | "lakeKivuBlue"
  | "volcanoGreen"
  | "savannaGold"
  | "amoledBlack"
  | "swahiliOcean"
  | "lavenderMist"
  | "auroraGlass"
  | "graphiteRose";

export type ThemeMode = "light" | "dark";

export interface ThemeOption {
  id: ThemeId;
  mode: ThemeMode;
  name: string;
}

export const themeStorageKey = "mr-creativist.theme";

export const themes = [
  { id: "light", name: "Light", mode: "light" },
  { id: "dark", name: "Dark", mode: "dark" },
  { id: "kigaliNight", name: "Kigali Night", mode: "dark" },
  { id: "rwandaSunrise", name: "Rwanda Sunrise", mode: "light" },
  { id: "lakeKivuBlue", name: "Lake Kivu Blue", mode: "light" },
  { id: "volcanoGreen", name: "Volcano Green", mode: "light" },
  { id: "savannaGold", name: "Savanna Gold", mode: "light" },
  { id: "amoledBlack", name: "AMOLED Black", mode: "dark" },
  { id: "swahiliOcean", name: "Swahili Ocean", mode: "dark" },
  { id: "lavenderMist", name: "Lavender Mist", mode: "light" },
  { id: "auroraGlass", name: "Aurora Glass", mode: "light" },
  { id: "graphiteRose", name: "Graphite Rose", mode: "dark" }
] as const satisfies readonly ThemeOption[];

export const defaultTheme = themes[0];
export const themeIds: readonly ThemeId[] = themes.map((theme) => theme.id);
export const darkThemeIds: readonly ThemeId[] = themes.filter((theme) => theme.mode === "dark").map((theme) => theme.id);

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return themeIds.includes(value as ThemeId);
}

export function getTheme(themeId: string | null | undefined): ThemeOption {
  return themes.find((theme) => theme.id === themeId) ?? defaultTheme;
}

export function getNextThemeId(themeId: ThemeId): ThemeId {
  const currentIndex = themes.findIndex((theme) => theme.id === themeId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % themes.length;
  return themes[nextIndex].id;
}

export function isDarkTheme(themeId: ThemeId): boolean {
  return darkThemeIds.includes(themeId);
}
