import { auth } from "@/auth";
import { friendlyMongoError } from "@/lib/mongodb";
import { sendAdminPayment } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const transaction = await sendAdminPayment(session.user, await parseJson(request));
    return Response.json({ transaction }, { status: 201 });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 422 });
  }
}
