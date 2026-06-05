import { auth } from "@/auth";
import { getAdminIntouchBalance } from "@/lib/platform-ledger";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    return Response.json(await getAdminIntouchBalance());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "IntouchPay balance check failed." },
      { status: 422 }
    );
  }
}
