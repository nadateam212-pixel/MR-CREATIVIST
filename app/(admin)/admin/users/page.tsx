import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AdminUsersPage() {
  await connectMongoDB();

  const users = await User.find({})
    .select("name email role validatedRoles accountStatus isVerified profileImage createdAt lastLoginAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <AdminAccountsManager
      initialUsers={clean(
        users.map((user) => ({
          ...user,
          id: String(user._id),
          validatedRoles: user.validatedRoles?.length ? user.validatedRoles : ["client", "student", "instructor", "seller", "freelancer", "consultant"],
          accountStatus: user.accountStatus ?? "active",
          isVerified: Boolean(user.isVerified)
        }))
      )}
      initialApplications={[]}
      mode="users"
    />
  );
}
