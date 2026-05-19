import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "instructor" && role !== "admin") {
    redirect("/dashboard?account=instructor-required");
  }

  return children;
}
