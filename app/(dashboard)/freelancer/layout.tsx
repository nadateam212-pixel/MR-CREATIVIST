import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function FreelancerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "freelancer" && role !== "admin") {
    redirect("/dashboard?account=freelancer-required");
  }

  return children;
}
