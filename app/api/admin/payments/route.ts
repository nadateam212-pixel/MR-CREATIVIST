import { auth } from "@/auth";
import { friendlyMongoError } from "@/lib/mongodb";
import { getAdminFinanceSnapshot, sendAdminPayment } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") return null;
  return session.user;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });

  try {
    const url = new URL(request.url);
    return Response.json(
      await getAdminFinanceSnapshot({
        status: url.searchParams.get("status") ?? "all",
        type: url.searchParams.get("type") ?? "all",
        search: url.searchParams.get("search") ?? ""
      })
    );
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });

  try {
    const transaction = await sendAdminPayment(admin, await parseJson(request));
    return Response.json({ transaction }, { status: 201 });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 422 });
  }
}
