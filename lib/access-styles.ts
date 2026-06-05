import { isFreePrice } from "@/lib/currency";

export type AccessType = "free" | "paid" | "premium";

export function courseAccessType(course: { accessType?: string; pricingType?: string; price?: string | number }): AccessType {
  const explicit = String(course.accessType || course.pricingType || "").toLowerCase();
  if (["premium", "subscription", "manual"].includes(explicit)) return "premium";
  if (explicit === "free" || isFreePrice(String(course.price ?? ""))) return "free";
  return "paid";
}

export function accessLabel(accessType: string) {
  if (accessType === "premium") return "Premium";
  if (accessType === "free") return "Free";
  return "Paid";
}

export function accessBadgeClass(accessType: string) {
  if (accessType === "premium") {
    return "border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (accessType === "free") {
    return "border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  return "border-sky-500/45 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

