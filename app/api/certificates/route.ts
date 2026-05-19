import { auth } from "@/auth";
import { getCertificateCredentials, issueCertificateCredential } from "@/lib/platform-ledger";
import { parseJson } from "@/lib/resource-api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const items = await getCertificateCredentials(session.user);
    return Response.json({ items, total: items.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Certificates unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = await parseJson(request);
    const item = await issueCertificateCredential(session.user, body);
    const items = await getCertificateCredentials(session.user);
    return Response.json({ item, items, total: items.length, message: "Certificate issued." }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Certificate issue failed." }, { status: 422 });
  }
}
