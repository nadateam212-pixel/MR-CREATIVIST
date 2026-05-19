import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminProfileMenu } from "@/components/admin/admin-profile-menu";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard?account=admin-required");
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50">
        <div className="mx-auto flex max-w-7xl justify-end px-4 sm:px-6 xl:px-8">
          <div className="pointer-events-auto">
            <AdminProfileMenu user={session.user} />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
