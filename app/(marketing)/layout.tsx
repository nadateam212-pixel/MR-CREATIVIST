import { MarketingShell } from "@/components/layout/marketing-shell";

export const revalidate = 60;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
