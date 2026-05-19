import { auth } from "@/auth";
import { handleWalletAction } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json({ message: "Use POST to request a wallet withdrawal.", timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = await parseJson(request);
    const snapshot = await handleWalletAction(session.user, { ...body, action: "withdraw" });
    return Response.json(snapshot, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Withdrawal request failed." }, { status: 422 });
  }
}
