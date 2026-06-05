import { auth } from "@/auth";
import { getPaymentBillData } from "@/lib/billing";
import { friendlyMongoError } from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";

export async function GET(_: Request, context: { params: Promise<{ transactionId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const { transactionId } = await context.params;
    const [transaction, bill] = await Promise.all([
      WalletTransaction.findById(transactionId).lean(),
      getPaymentBillData(transactionId)
    ]);

    if (!transaction) return Response.json({ error: "Payment transaction not found." }, { status: 404 });

    return Response.json({
      transaction: {
        ...transaction,
        id: String(transaction._id),
        rawAmount: transaction.amount
      },
      bill
    });
  } catch (error) {
    return Response.json({ error: friendlyMongoError(error) }, { status: 422 });
  }
}
