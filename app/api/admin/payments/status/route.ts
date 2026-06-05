import { auth } from "@/auth";
import { friendlyMongoError } from "@/lib/mongodb";
import { refreshIntouchTransactionStatus } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = await parseJson(request);
    const referenceId = String(body?.referenceId ?? body?.requestTransactionId ?? "").trim();
    const transaction = await refreshIntouchTransactionStatus(referenceId);

    return Response.json({ transaction });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 422 });
  }
}
