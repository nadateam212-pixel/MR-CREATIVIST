import { auth } from "@/auth";
import { getWorkspaceSnapshot, recordWorkspaceAction } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

function parseTags(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const url = new URL(request.url);
    const snapshot = await getWorkspaceSnapshot(session.user, {
      pathname: url.searchParams.get("pathname") ?? undefined,
      title: url.searchParams.get("title") ?? undefined,
      tags: parseTags(url.searchParams.get("tags"))
    });

    return Response.json(snapshot);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Workspace unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = await parseJson(request);
    const snapshot = await recordWorkspaceAction(session.user, body);
    return Response.json(snapshot, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Workspace action failed." }, { status: 422 });
  }
}
