import { NextResponse } from "next/server";
import { apiOk } from "@/lib/api";
import { sendPaymentBillEmail } from "@/lib/billing";
import { markOrderPaid, completeCourseEnrollmentPayment } from "@/lib/payment-finalization";
import { capturePayPalOrder } from "@/lib/paypal";
import { readJson } from "@/lib/mongo-api";
import WalletTransaction from "@/models/WalletTransaction";

type PayPalCapturePayload = {
  id?: unknown;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id?: unknown }>;
    };
  }>;
};

function captureId(payload: PayPalCapturePayload) {
  return String(payload.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? payload.id ?? "").trim();
}

async function completePayPalTransaction(transactionId: string, paypalOrderId?: string) {
  const transaction = await WalletTransaction.findById(transactionId);
  if (!transaction) throw new Error("PayPal transaction not found.");

  const orderId = paypalOrderId || transaction.metadata?.paypalOrderId || transaction.providerReference;
  if (!orderId) throw new Error("PayPal order ID is missing.");

  const capture = await capturePayPalOrder(orderId);
  const providerTransactionId = captureId(capture);

  transaction.status = "completed";
  transaction.providerReference = orderId;
  transaction.providerTransactionId = providerTransactionId;
  transaction.metadata = {
    ...(transaction.metadata ?? {}),
    paypalCapture: capture,
    paypalCapturedAt: new Date()
  };
  await transaction.save();

  if (transaction.referenceType === "order") {
    await markOrderPaid(String(transaction.referenceId), {
      transactionId: String(transaction._id),
      paymentReference: orderId,
      providerTransactionId
    });
  } else if (transaction.metadata?.payableType === "course_enrollment") {
    await completeCourseEnrollmentPayment(transaction.toObject(), { transactionId: String(transaction._id) });
  } else {
    await sendPaymentBillEmail(String(transaction._id));
  }

  return transaction;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId") ?? url.searchParams.get("reference") ?? "";
  const paypalOrderId = url.searchParams.get("token") ?? "";

  try {
    const transaction = await completePayPalTransaction(transactionId, paypalOrderId);
    const redirectPath = transaction.metadata?.payableType === "course_enrollment" ? "/dashboard/my-courses?paypal=paid" : "/dashboard/orders?paypal=paid";

    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    console.error("[paypal] Capture failed", error);
    return NextResponse.redirect(new URL("/marketplace/cart?paypal=failed", request.url));
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const transaction = await completePayPalTransaction(String(body.transactionId ?? ""), String(body.paypalOrderId ?? body.orderId ?? ""));

    return apiOk({ provider: "paypal", status: "completed", transaction });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "PayPal capture failed." }, { status: 422 });
  }
}
