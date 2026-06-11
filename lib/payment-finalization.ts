import { sendPaymentBillEmail } from "@/lib/billing";
import { saveCourseEnrollment } from "@/lib/enrollment-service";
import { connectMongoDB } from "@/lib/mongodb";
import { recordWalletTransaction } from "@/lib/platform-ledger";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ReferralProfile from "@/models/ReferralProfile";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord {
  return value && typeof value === "object" ? (value as LooseRecord) : {};
}

async function creditReferralCommission({
  buyerEmail,
  buyerId,
  grossAmount,
  currency = "FRW",
  referenceId,
  sourceLabel
}: {
  buyerEmail?: string;
  buyerId?: unknown;
  grossAmount: number;
  currency?: string;
  referenceId: string;
  sourceLabel: string;
}) {
  const buyer = await User.findOne({
    $or: [
      ...(buyerId ? [{ _id: buyerId }] : []),
      ...(buyerEmail ? [{ email: String(buyerEmail).toLowerCase() }] : [])
    ]
  })
    .select("email referredByUserId referredByEmail referredByCode")
    .lean();

  const referrerEmail = String(buyer?.referredByEmail ?? "").toLowerCase();
  if (!referrerEmail || referrerEmail === String(buyer?.email ?? buyerEmail ?? "").toLowerCase()) return null;

  const commissionAmount = Math.round(Number(grossAmount ?? 0) * 0.05 * 100) / 100;
  if (!Number.isFinite(commissionAmount) || commissionAmount <= 0) return null;

  try {
    const transaction = await recordWalletTransaction(
      {
        id: buyer?.referredByUserId ? String(buyer.referredByUserId) : undefined,
        email: referrerEmail,
        name: referrerEmail,
        role: "client"
      },
      {
        type: "referral_earning",
        direction: "credit",
        amount: commissionAmount,
        currency,
        status: "completed",
        description: `Referral commission: ${sourceLabel}`,
        referenceType: "referral",
        referenceId,
        metadata: {
          buyerEmail: buyer?.email ?? buyerEmail,
          grossAmount,
          commissionRate: 0.05,
          referredByCode: buyer?.referredByCode
        }
      }
    );

    await ReferralProfile.findOneAndUpdate(
      { userEmail: referrerEmail },
      {
        $inc: {
          conversions: 1,
          revenue: Number(grossAmount ?? 0),
          unpaidCommission: commissionAmount
        },
        $set: {
          commissionRate: 0.05
        }
      },
      { upsert: false }
    );

    return transaction;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000) {
      return null;
    }

    throw error;
  }
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

  await creditReferralCommission({
    buyerEmail: order.buyerEmail,
    buyerId: order.buyerId,
    grossAmount: Number(order.total ?? 0),
    currency: order.currency ?? "FRW",
    referenceId: `order:${order._id}`,
    sourceLabel: `Marketplace order ${order._id}`
  });

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

  await creditReferralCommission({
    buyerEmail: learnerEmail,
    buyerId: transaction.userId,
    grossAmount: Number(transaction.amount ?? 0),
    currency: String(transaction.currency ?? "FRW"),
    referenceId: `enrollment:${result.enrollment._id}`,
    sourceLabel: `Course enrollment: ${result.course.title}`
  });

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
