import Image from "next/image";
import { brand } from "@/lib/brand";

export default function MarketingLoading() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center text-[hsl(var(--foreground))]">
      <span className="relative mb-6 flex size-20 overflow-hidden rounded-lg bg-white p-3 shadow-2xl shadow-cyan-500/20">
        <Image src={brand.logo} alt={brand.name} fill sizes="80px" className="object-contain p-2" priority />
      </span>
      <h1 className="text-3xl font-black tracking-tight">Loading MR Creativist</h1>
      <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Preparing public tools, jobs, businesses, messages and AI workspace.</p>
    </div>
  );
}
