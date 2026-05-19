import type { Metadata } from "next";
import { JobAdminConsole } from "@/components/platform/job-shop-workbenches";
import { getJobPosts } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Jobs Admin"
};

export default async function AdminJobsPage() {
  const jobs = await getJobPosts({ limit: 24 });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Jobs module</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Publish jobs to the public page</h1>
        <p className="mt-4 max-w-3xl text-[hsl(var(--muted-foreground))]">
          Create detailed job posts with responsibilities, requirements, salary, skills, apply links and contact details.
        </p>
      </div>
      <JobAdminConsole initialJobs={jobs} />
    </div>
  );
}
