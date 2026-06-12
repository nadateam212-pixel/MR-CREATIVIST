import { auth } from "@/auth";
import { FreelancerProfileEditor } from "@/components/platform/freelancer-profile-editor";
import connectMongoDB from "@/lib/mongodb";
import FreelancerProfile from "@/models/FreelancerProfile";

export const dynamic = "force-dynamic";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function FreelancerProfilePage() {
  const session = await auth();
  await connectMongoDB();
  const profile = session?.user?.id ? await FreelancerProfile.findOne({ userId: session.user.id }).lean() : null;

  return (
    <FreelancerProfileEditor
      user={{ name: session?.user?.name ?? "MR Creativist Freelancer", image: session?.user?.image ?? "/icons/logo.png" }}
      initialProfile={profile ? clean({ ...profile, id: String(profile._id) }) : null}
    />
  );
}
