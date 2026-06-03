import { auth } from "@/auth";
import { FreelancerGigManager } from "@/components/platform/freelancer-gig-manager";
import { getGigs } from "@/lib/platform-db";

export default async function FreelancerGigsPage() {
  const session = await auth();
  const gigs = session?.user?.id ? await getGigs({ ownerId: session.user.id, all: true }) : [];

  return (
    <FreelancerGigManager
      freelancerId={session?.user?.id}
      freelancerName={session?.user?.name ?? "MR Creativist Freelancer"}
      initialGigs={gigs}
    />
  );
}
