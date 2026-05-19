import type { Metadata } from "next";
import { GlobalSearchResults } from "@/components/platform/global-search-results";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;

  return <GlobalSearchResults initialQuery={params.q ?? ""} />;
}
