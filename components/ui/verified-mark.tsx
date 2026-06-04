import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedMark({
  label = "Verified account",
  className
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      aria-label={label}
      title={label}
      className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm", className)}
    >
      <Check className="size-3 stroke-[3]" aria-hidden="true" />
    </span>
  );
}
