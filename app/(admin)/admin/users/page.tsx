import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";
import connectMongoDB from "@/lib/mongodb";
import AccountApplication from "@/models/AccountApplication";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AdminUsersPage() {
  await connectMongoDB();

  const [users, applications] = await Promise.all([
    User.find({})
      .select("name email role validatedRoles accountStatus isVerified createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    AccountApplication.find({}).sort({ updatedAt: -1 }).limit(100).lean()
  ]);

  return (
    <AdminAccountsManager
      initialUsers={clean(
        users.map((user) => ({
          ...user,
          id: String(user._id),
          validatedRoles: user.validatedRoles ?? ["client"],
          accountStatus: user.accountStatus ?? "active",
          isVerified: Boolean(user.isVerified)
        }))
      )}
      initialApplications={clean(
        applications.map((application) => ({
          ...application,
          id: String(application._id),
          userId: String(application.userId)
        }))
      )}
    />
  );
}
