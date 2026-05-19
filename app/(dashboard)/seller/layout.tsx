import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "seller" && role !== "admin") {
    redirect("/dashboard?account=seller-required");
  }

  return children;
}
