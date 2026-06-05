import { auth } from "@/auth";
import { getPaymentBillData, renderPaymentBillPdf } from "@/lib/billing";
import { friendlyMongoError } from "@/lib/mongodb";

export async function GET(_: Request, context: { params: Promise<{ transactionId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const { transactionId } = await context.params;
    const bill = await getPaymentBillData(transactionId);
    const pdf = await renderPaymentBillPdf(bill);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${bill.billNo}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error) }, { status: 422 });
  }
}
