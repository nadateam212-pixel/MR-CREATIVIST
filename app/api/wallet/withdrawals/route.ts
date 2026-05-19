import { auth } from "@/auth";
import { friendlyMongoError } from "@/lib/mongodb";
import { getWalletSnapshot, handleWalletAction } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const snapshot = await getWalletSnapshot(session.user);
    const items = snapshot.transactions.filter((transaction) => transaction.type === "withdrawal" || transaction.type === "payout");
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = await parseJson(request);
    const snapshot = await handleWalletAction(session.user, { ...body, action: "withdraw" });
    return Response.json(snapshot, { status: 201 });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 422 });
  }
}
