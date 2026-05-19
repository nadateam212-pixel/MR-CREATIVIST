import { auth } from "@/auth";
import { FreelancerGigManager } from "@/components/platform/freelancer-gig-manager";

export default async function FreelancerGigsPage() {
  const session = await auth();

  return (
    <FreelancerGigManager
      freelancerId={session?.user?.id}
      freelancerName={session?.user?.name ?? "MR Creativist Freelancer"}
    />
  );
}
