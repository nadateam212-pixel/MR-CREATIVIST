import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("grid size-10 place-items-center overflow-hidden rounded-full bg-[hsl(var(--muted))] text-sm font-semibold", className)}>
      {src ? <Image src={src} alt={name} width={40} height={40} className="size-full object-cover" /> : initials}
    </div>
  );
}
