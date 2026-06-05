import { sendPaymentBillEmail } from "@/lib/billing";
import { saveCourseEnrollment } from "@/lib/enrollment-service";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import WalletTransaction from "@/models/WalletTransaction";

type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord {
  return value && typeof value === "object" ? (value as LooseRecord) : {};
}

export async function markOrderPaid(
  orderId: string,
  options: {
    transactionId?: string;
    paymentReference?: string;
    providerTransactionId?: string;
  } = {}
) {
  await connectMongoDB();

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");

  const alreadyPaid = Boolean(order.paidAt || ["paid", "fulfilled"].includes(order.status));

  if (!alreadyPaid) {
    await Promise.all(
      (order.items ?? []).map((item: LooseRecord) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -Number(item.quantity ?? 1), downloads: Number(item.quantity ?? 1) }
        })
      )
    );
  }

  order.status = "paid";
  order.paidAt = order.paidAt ?? new Date();
  order.paymentReference = options.paymentReference || order.paymentReference;
  order.providerTransactionId = options.providerTransactionId || order.providerTransactionId;
  await order.save();

  if (options.transactionId && !order.billSentAt) {
    const delivery = await sendPaymentBillEmail(options.transactionId);
    if (delivery?.ok) {
      order.billSentAt = new Date();
      await order.save();
    }
  }

  return order;
}

export async function completeCourseEnrollmentPayment(
  transaction: LooseRecord,
  options: { transactionId?: string } = {}
) {
  await connectMongoDB();

  const metadata = asRecord(transaction.metadata);
  const courseId = String(metadata.courseId ?? "");
  const learnerEmail = String(metadata.learnerEmail ?? transaction.userEmail ?? "").toLowerCase();
  const learnerName = String(metadata.learnerName ?? learnerEmail.split("@")[0] ?? "Learner");

  if (!courseId || !learnerEmail) {
    throw new Error("Course payment is missing enrollment details.");
  }

  const result = await saveCourseEnrollment({
    courseId,
    enrollment: {
      courseId,
      learnerName,
      learnerEmail,
      paidAmount: Number(transaction.amount ?? 0)
    },
    session: {
      user: {
        id: transaction.userId ? String(transaction.userId) : undefined,
        name: learnerName,
        email: learnerEmail
      }
    }
  });

  if (!result.course || !result.enrollment) throw new Error("Course enrollment could not be completed.");

  const transactionId = options.transactionId ?? String(transaction._id ?? "");
  if (transactionId) {
    await WalletTransaction.findByIdAndUpdate(transactionId, {
      $set: {
        referenceType: "enrollment",
        referenceId: String(result.enrollment._id),
        "metadata.courseTitle": result.course.title,
        "metadata.enrollmentId": String(result.enrollment._id)
      }
    });

    await sendPaymentBillEmail(transactionId);
  }

  return result;
}
