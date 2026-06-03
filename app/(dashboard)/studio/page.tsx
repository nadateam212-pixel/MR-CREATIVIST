import type { Metadata } from "next";
import { StudioDashboard } from "@/components/platform/studio-dashboard";

export const metadata: Metadata = {
  title: "MrC. Studio"
};

export default function StudioPage() {
  return <StudioDashboard />;
}
