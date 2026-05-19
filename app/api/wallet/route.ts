import { auth } from "@/auth";
import { friendlyMongoError } from "@/lib/mongodb";
import { getWalletSnapshot, handleWalletAction } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    return Response.json(await getWalletSnapshot(session.user));
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = await parseJson(request);
    return Response.json(await handleWalletAction(session.user, body), { status: 201 });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error), degraded: true }, { status: 422 });
  }
}
