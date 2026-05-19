import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountApplicationForm } from "@/components/account/account-application-form";
import { isElevatedAccountRole, roleApplicationProfiles } from "@/lib/account-roles";
import connectMongoDB from "@/lib/mongodb";
import AccountApplication from "@/models/AccountApplication";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AccountApplicationPage({ params }: { params: Promise<{ role: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "admin") redirect("/admin/account-applications");

  const { role } = await params;
  if (!isElevatedAccountRole(role)) notFound();

  await connectMongoDB();

  const [user, existingApplication] = await Promise.all([
    User.findById(session.user.id).select("validatedRoles").lean(),
    AccountApplication.findOne({ userId: session.user.id, requestedRole: role }).sort({ updatedAt: -1 }).lean()
  ]);

  if (!user) redirect("/login");

  return (
    <AccountApplicationForm
      profile={roleApplicationProfiles[role]}
      existingApplication={
        existingApplication
          ? clean({
              ...existingApplication,
              id: String(existingApplication._id),
              userId: String(existingApplication.userId)
            })
          : null
      }
      alreadyValidated={(user.validatedRoles ?? []).includes(role)}
    />
  );
}
