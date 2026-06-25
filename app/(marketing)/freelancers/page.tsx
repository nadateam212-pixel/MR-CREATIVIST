import type { Metadata } from "next";
import { FreelancerStudio } from "@/components/platform/freelancer-studio";
import { getFreelancers, getGigs } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Freelancers",
  description:
    "Hire, manage, review and pay verified freelancers through the Mr Creativist freelancer studio."
};

export default async function FreelancersPage() {
  const [freelancers, gigs] = await Promise.all([
    getFreelancers({ limit: 120 }),
    getGigs({ limit: 120 })
  ]);

  return <FreelancerStudio initialFreelancers={freelancers} initialGigs={gigs} />;
}
