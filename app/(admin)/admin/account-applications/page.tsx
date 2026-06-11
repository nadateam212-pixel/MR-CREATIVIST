import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";
import connectMongoDB from "@/lib/mongodb";
import AccountApplication from "@/models/AccountApplication";

export const dynamic = "force-dynamic";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function AdminAccountApplicationsPage() {
  await connectMongoDB();

  const applications = await AccountApplication.find({}).sort({ updatedAt: -1 }).limit(100).lean();

  return (
    <AdminAccountsManager
      initialUsers={[]}
      initialApplications={clean(
        applications.map((application) => ({
          ...application,
          id: String(application._id),
          userId: String(application.userId)
        }))
      )}
      mode="applications"
    />
  );
}
