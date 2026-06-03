import type { Metadata } from "next";
import { auth } from "@/auth";
import { FreelancerStudio } from "@/components/platform/freelancer-studio";
import { getFreelancers, getGigs } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Freelancers",
  description:
    "Hire, manage, review and pay verified freelancers through the Mr Creativist freelancer studio."
};

export default async function FreelancersPage() {
  const [session, freelancers, gigs] = await Promise.all([auth(), getFreelancers(), getGigs()]);
  const currentUser = session?.user;
  const hasFreelancerAccess =
    currentUser?.role === "freelancer" || currentUser?.validatedRoles?.includes("freelancer");
  const freelancerItems =
    hasFreelancerAccess && currentUser && !freelancers.some((freelancer: { id?: string }) => freelancer.id === currentUser.id)
      ? [
          {
            id: currentUser.id,
            name: currentUser.name ?? "Validated Freelancer",
            role: "Validated MR Creativist freelancer",
            specialty: "Creative Services",
            location: "Kigali, Rwanda",
            rate: 45,
            rating: 5,
            completed: 0,
            responseHours: 8,
            availability: 80,
            portfolio: 75,
            languages: ["ENGLISH"],
            skills: ["AI WORKFLOWS", "COPYWRITING", "VIDEO EDITING", "COURSE FUNNELS"],
            verified: ["Validated freelancer account"],
            image:
              currentUser.image ??
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=85"
          },
          ...freelancers
        ]
      : freelancers;

  return <FreelancerStudio initialFreelancers={freelancerItems} initialGigs={gigs} />;
}
