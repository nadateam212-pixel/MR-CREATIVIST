import type { Metadata } from "next";
import { JobsDirectory } from "@/components/platform/job-shop-workbenches";
import { getJobPosts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Jobs"
};

export default async function JobsPage() {
  const jobs = await getJobPosts();

  return (
    <div className="app-frame py-8">
      <JobsDirectory jobs={jobs} />
    </div>
  );
}
