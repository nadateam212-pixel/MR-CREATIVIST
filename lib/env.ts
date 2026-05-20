export function cleanEnvValue(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  return trimmed.replace(/^["']|["']$/g, "").trim();
}

export function hasWrappingQuotes(name: string) {
  const value = String(process.env[name] ?? "").trim();
  return (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  );
}

export function env(name: string, fallback = "") {
  const value = cleanEnvValue(process.env[name]);
  if (!value || value === "undefined" || value === "null") return fallback;
  return value;
}

export function envBoolean(name: string, defaultValue = false) {
  const value = env(name).toLowerCase();
  if (!value) return defaultValue;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return defaultValue;
}

export function envNumber(name: string, fallback: number) {
  const value = Number(env(name));
  return Number.isFinite(value) ? value : fallback;
}
