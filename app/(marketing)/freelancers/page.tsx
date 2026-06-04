import type { Metadata } from "next";
import { auth } from "@/auth";
import { FreelancerStudio } from "@/components/platform/freelancer-studio";
import { getFreelancers, getGigs } from "@/lib/platform-db";

export const metadata: Metadata = {
  title: "Freelancers",
  description:
    "Hire, manage, review and pay verified freelancers through the Mr Creativist freelancer studio."
};

function rateFromPrice(price: unknown) {
  const numeric = Number(String(price ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 45;
}

function gigLocation(gig: { ownerAddress?: string; ownerCity?: string; ownerCountry?: string }) {
  return [gig.ownerAddress, gig.ownerCity, gig.ownerCountry].filter(Boolean).join(", ") || "Remote";
}

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
            isVerified: Boolean((currentUser as { isVerified?: boolean }).isVerified),
            image:
              currentUser.image ??
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=85"
          },
          ...freelancers
        ]
      : freelancers;
  const existingFreelancerIds = new Set(freelancerItems.map((freelancer: { id?: unknown }) => String(freelancer.id ?? "")));
  const derivedGigFreelancers = gigs.reduce((items: any[], gig: any) => {
    const ownerId = String(gig.ownerId ?? "");
    if (!ownerId || existingFreelancerIds.has(ownerId) || items.some((item) => item.id === ownerId)) return items;

    items.push({
      id: ownerId,
      name: gig.ownerName ?? "Studio freelancer",
      role: "Studio gig freelancer",
      specialty: gig.category ?? "Creative services",
      location: gigLocation(gig),
      rate: rateFromPrice(gig.price),
      rating: Number(gig.rating ?? 0),
      completed: Number(gig.orders ?? 0),
      responseHours: 8,
      availability: 80,
      portfolio: 70,
      languages: ["ENGLISH"],
      skills: (gig.tags?.length ? gig.tags : [gig.category, gig.packageName]).filter(Boolean),
      verified: gig.isVerified ? ["Verified account"] : [],
      isVerified: Boolean(gig.isVerified),
      image: gig.ownerImage ?? gig.image ?? "/icons/logo.png"
    });
    return items;
  }, []);

  return <FreelancerStudio initialFreelancers={[...freelancerItems, ...derivedGigFreelancers]} initialGigs={gigs} />;
}
