import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "consultant" && role !== "admin") {
    redirect("/dashboard?account=consultant-required");
  }

  return children;
}
