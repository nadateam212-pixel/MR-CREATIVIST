import { auth } from "@/auth";
import { friendlyMongoError, isMongoConnectionError } from "@/lib/mongodb";
import { getWalletSnapshot, handleWalletAction } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const snapshot = await getWalletSnapshot(session.user);
    return Response.json({ items: snapshot.transactions, total: snapshot.transactions.length });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = await parseJson(request);
    const snapshot = await handleWalletAction(session.user, body);
    return Response.json({ items: snapshot.transactions, total: snapshot.transactions.length, wallet: snapshot }, { status: 201 });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: isMongoConnectionError(error) }, { status: 422 });
  }
}
