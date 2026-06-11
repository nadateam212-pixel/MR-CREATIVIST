import type { Metadata } from "next";
import { JobsDirectory } from "@/components/platform/job-shop-workbenches";
import { getJobPosts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Jobs"
};

export default async function JobsPage() {
  const jobs = await getJobPosts();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <JobsDirectory jobs={jobs} />
    </div>
  );
}
