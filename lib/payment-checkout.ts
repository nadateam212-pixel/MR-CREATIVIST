import { convertMoney } from "@/lib/currency";
import { markOrderPaid, completeCourseEnrollmentPayment } from "@/lib/payment-finalization";
import { createPayPalOrder, paypalCurrency } from "@/lib/paypal";
import {
  createIntouchRequestId,
  formatRwandaMobilePhone,
  isPaymentRequestAccepted,
  requestIntouchPayment
} from "@/lib/intouchpay";
import { connectMongoDB } from "@/lib/mongodb";
import { latestBalance, recordWalletTransaction } from "@/lib/platform-ledger";
import Course from "@/models/Course";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { mongoIdOrSlug } from "@/lib/mongo-api";

export type PaymentMethod = "wallet" | "mtn_momo" | "paypal" | "stripe";

type CheckoutSession = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
} | null;

type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord {
  return value && typeof value === "object" ? (value as LooseRecord) : {};
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  const method = String(value ?? "wallet").toLowerCase().replace(/[\s-]+/g, "_");
  if (["mobile_money", "momo", "mtn", "mtn_momo", "intouch", "intouch_mtn_momo"].includes(method)) return "mtn_momo";
  if (["paypal", "pay_pal"].includes(method)) return "paypal";
  if (["stripe", "stripe_card", "card", "credit_card"].includes(method)) return "stripe";
  return "wallet";
}

function buyerFrom(session: CheckoutSession, body: LooseRecord) {
  const email = normalizeEmail(session?.user?.email ?? body.buyerEmail ?? body.email);
  const name = String(session?.user?.name ?? body.buyerName ?? body.name ?? email.split("@")[0] ?? "MR Creativist customer").trim();

  if (!email) throw new Error("Buyer email is required.");
  if (!name || name.length < 2) throw new Error("Buyer name is required.");

  return {
    id: session?.user?.id,
    email,
    name,
    role: session?.user?.role ?? "client"
  };
}

function frw(value: number, currency: string) {
  return Math.round(convertMoney(Number(value ?? 0), currency === "USD" ? "USD" : "FRW", "FRW"));
}

function usd(value: number, currency: string) {
  return convertMoney(Number(value ?? 0), currency === "FRW" ? "FRW" : "USD", "USD");
}

async function productAllowsCheckout(product: LooseRecord) {
  const sellerId =
    product.sellerId && typeof product.sellerId === "object" && "_id" in product.sellerId
      ? (product.sellerId as { _id?: unknown })._id
      : product.sellerId;
  if (!sellerId) return Boolean(product.isVerified);

  const verifiedSeller = await User.exists({ _id: sellerId, isVerified: true });
  return Boolean(product.isVerified || verifiedSeller);
}

async function createOrderFromItems(session: CheckoutSession, body: LooseRecord) {
  const buyer = buyerFrom(session, body);
  const items = Array.isArray(body.items) ? body.items : [];
  const paymentDetails = asRecord(body.paymentDetails);
  if (!items.length) throw new Error("At least one item is required.");

  const orderItems: Array<{
    productId: unknown;
    name: unknown;
    slug: unknown;
    quantity: number;
    unitPrice: number;
  }> = [];
  for (const item of items) {
    const checkoutItem = asRecord(item);
    const product = await Product.findOne(mongoIdOrSlug(String(checkoutItem.productId ?? checkoutItem.slug ?? ""))).lean();
    if (!product) throw new Error(`Product not found: ${checkoutItem.productId}`);
    if (product.status !== "published") throw new Error(`Product is not available for checkout: ${String(product.name)}`);
    if (!(await productAllowsCheckout(product))) {
      throw new Error(`${String(product.name)} is not verified for online checkout yet. Contact the seller directly.`);
    }

    const quantity = Math.max(1, Number(checkoutItem.quantity ?? 1));
    orderItems.push({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      quantity,
      unitPrice: frw(Number(product.price ?? 0), String(product.currency ?? "FRW"))
    });
  }

  const subtotal = orderItems.reduce((total, item) => total + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1), 0);
  const discount = 0;
  const tax = 0;
  const total = subtotal;

  const order = await Order.create({
    buyerId: buyer.id,
    buyerName: buyer.name,
    buyerEmail: buyer.email,
    items: orderItems,
    subtotal,
    discount,
    tax,
    total,
    currency: "FRW",
    paymentMethod: normalizePaymentMethod(body.paymentMethod),
    status: "pending",
    metadata: {
      checkoutSource: body.source ?? "checkout",
      originalPaymentMethod: body.paymentMethod,
      buyerPhone: body.buyerPhone ?? body.phone ?? paymentDetails.mobilePhone,
      billingAddress: body.billingAddress ?? body.address,
      shippingAddress: body.shippingAddress
    }
  });

  return { buyer, order, total };
}

export async function processProductCheckout(session: CheckoutSession, body: LooseRecord) {
  await connectMongoDB();

  const paymentMethod = normalizePaymentMethod(body.paymentMethod);
  if (paymentMethod === "stripe") throw new Error("Stripe card payments are coming soon.");

  const { buyer, order, total } = await createOrderFromItems(session, body);

  if (paymentMethod === "wallet") {
    if (!session?.user?.email) throw new Error("Sign in before paying with wallet.");
    const balance = await latestBalance(buyer.email, "FRW");
    if (balance < total) throw new Error("Insufficient wallet balance for this order.");

    const transaction = await recordWalletTransaction(
      { id: buyer.id, email: buyer.email, name: buyer.name, role: buyer.role },
      {
        type: "purchase",
        direction: "debit",
        amount: total,
        currency: "FRW",
        status: "completed",
        description: `Marketplace order ${order._id}`,
        referenceType: "order",
        referenceId: String(order._id),
        metadata: {
          paymentMethod,
          payableType: "order",
          orderId: String(order._id)
        }
      }
    );

    await markOrderPaid(String(order._id), {
      transactionId: String(transaction._id),
      paymentReference: String(transaction._id)
    });

    return { status: "paid", order, transaction, message: "Order paid with wallet." };
  }

  if (paymentMethod === "mtn_momo") {
    const paymentDetails = asRecord(body.paymentDetails);
    const mobilePhone = formatRwandaMobilePhone(String(paymentDetails.mobilePhone ?? body.mobilePhone ?? body.phone ?? ""));
    if (!mobilePhone) throw new Error("MTN Mobile Money phone number is required.");

    const requestTransactionId = createIntouchRequestId("MRC-ORD");
    const transaction = await recordWalletTransaction(
      { id: buyer.id, email: buyer.email, name: buyer.name, role: buyer.role },
      {
        type: "purchase",
        direction: "debit",
        amount: total,
        currency: "FRW",
        status: "pending",
        description: `MTN Mobile Money order payment ${order._id}`,
        referenceType: "order",
        referenceId: String(order._id),
        requestTransactionId,
        mobilePhone,
        metadata: {
          affectsBalance: false,
          paymentMethod,
          provider: "intouchpay",
          payableType: "order",
          orderId: String(order._id)
        }
      }
    );

    const response = await requestIntouchPayment({ amount: total, mobilePhone, requestTransactionId });
    if (!isPaymentRequestAccepted(response)) {
      await WalletTransaction.findByIdAndUpdate(transaction._id, {
        $set: {
          status: "failed",
          providerReference: response.data?.referenceno ?? response.data?.referenceid,
          metadata: { ...(transaction.metadata ?? {}), responseCode: response.code, responseMessage: response.message, response: response.data }
        }
      });
      throw new Error(response.message || "Mobile Money payment request failed.");
    }

    await Order.findByIdAndUpdate(order._id, { paymentReference: requestTransactionId });
    await WalletTransaction.findByIdAndUpdate(transaction._id, {
      $set: {
        providerReference: response.data?.referenceno ?? response.data?.referenceid,
        metadata: { ...(transaction.metadata ?? {}), responseCode: response.code, responseMessage: response.message, response: response.data }
      }
    });

    return {
      status: "pending",
      order,
      transaction,
      message: "Approve the MTN Mobile Money prompt to complete checkout."
    };
  }

  const paypalAmount = usd(total, "FRW");
  const transaction = await recordWalletTransaction(
    { id: buyer.id, email: buyer.email, name: buyer.name, role: buyer.role },
    {
      type: "purchase",
      direction: "debit",
      amount: total,
      currency: "FRW",
      status: "pending",
      description: `PayPal order payment ${order._id}`,
      referenceType: "order",
      referenceId: String(order._id),
      metadata: {
        affectsBalance: false,
        paymentMethod,
        payableType: "order",
        orderId: String(order._id),
        paypalAmount,
        paypalCurrency: paypalCurrency()
      }
    }
  );
  const paypal = await createPayPalOrder({
    amount: paypalAmount,
    description: `MR Creativist order ${order._id}`,
    referenceId: String(transaction._id),
    returnPath: `/api/payments/paypal?transactionId=${transaction._id}`,
    cancelPath: "/marketplace/cart?paypal=cancelled"
  });

  await Promise.all([
    Order.findByIdAndUpdate(order._id, { paymentReference: paypal.id }),
    WalletTransaction.findByIdAndUpdate(transaction._id, {
      $set: {
        providerReference: paypal.id,
        metadata: { ...(transaction.metadata ?? {}), paypalOrderId: paypal.id, approvalUrl: paypal.approvalUrl }
      }
    })
  ]);

  return { status: "redirect", order, transaction, approvalUrl: paypal.approvalUrl, message: "Continue to PayPal to complete payment." };
}

export async function processCourseCheckout(session: CheckoutSession, body: LooseRecord) {
  await connectMongoDB();

  const buyer = buyerFrom(session, body);
  const buyerAddress = body.billingAddress ?? body.address;
  const paymentMethod = normalizePaymentMethod(body.paymentMethod);
  if (paymentMethod === "stripe") throw new Error("Stripe card payments are coming soon.");

  const course = await Course.findOne(mongoIdOrSlug(String(body.courseId ?? body.slug ?? ""))).lean();
  if (!course) throw new Error("Course not found.");

  const subtotal = frw(Number(course.price ?? 0), String(course.currency ?? "FRW"));
  const total = subtotal;

  if (total <= 0) {
    const enrollment = await completeCourseEnrollmentPayment({
      userId: buyer.id,
      userEmail: buyer.email,
      amount: 0,
      metadata: {
        courseId: String(course._id),
        courseTitle: course.title,
        learnerName: buyer.name,
        learnerEmail: buyer.email,
        billingAddress: buyerAddress
      }
    });

    return { status: "paid", enrollment, message: "Free course enrollment completed." };
  }

  if (paymentMethod === "wallet") {
    if (!session?.user?.email) throw new Error("Sign in before paying with wallet.");
    const balance = await latestBalance(buyer.email, "FRW");
    if (balance < total) throw new Error("Insufficient wallet balance for this course.");

    const enrollment = await completeCourseEnrollmentPayment({
      userId: buyer.id,
      userEmail: buyer.email,
      amount: total,
      metadata: {
        courseId: String(course._id),
        courseTitle: course.title,
        learnerName: buyer.name,
        learnerEmail: buyer.email,
        billingAddress: buyerAddress
      }
    });
    const transaction = await recordWalletTransaction(
      { id: buyer.id, email: buyer.email, name: buyer.name, role: buyer.role },
      {
        type: "purchase",
        direction: "debit",
        amount: total,
        currency: "FRW",
        status: "completed",
        description: `Course enrollment: ${course.title}`,
        referenceType: "enrollment",
        referenceId: String(enrollment.enrollment._id),
        metadata: {
          paymentMethod,
          payableType: "course_enrollment",
          courseId: String(course._id),
          courseTitle: course.title,
          learnerName: buyer.name,
          learnerEmail: buyer.email,
          billingAddress: buyerAddress
        }
      }
    );

    await completeCourseEnrollmentPayment(transaction, { transactionId: String(transaction._id) });
    return { status: "paid", enrollment, transaction, message: "Course paid with wallet." };
  }

  if (paymentMethod === "mtn_momo") {
    const paymentDetails = asRecord(body.paymentDetails);
    const mobilePhone = formatRwandaMobilePhone(String(paymentDetails.mobilePhone ?? body.mobilePhone ?? body.phone ?? ""));
    if (!mobilePhone) throw new Error("MTN Mobile Money phone number is required.");

    const requestTransactionId = createIntouchRequestId("MRC-CRS");
    const transaction = await recordWalletTransaction(
      { id: buyer.id, email: buyer.email, name: buyer.name, role: buyer.role },
      {
        type: "purchase",
        direction: "debit",
        amount: total,
        currency: "FRW",
        status: "pending",
        description: `MTN Mobile Money course payment: ${course.title}`,
        referenceType: "enrollment",
        referenceId: requestTransactionId,
        requestTransactionId,
        mobilePhone,
        metadata: {
          affectsBalance: false,
          paymentMethod,
          provider: "intouchpay",
          payableType: "course_enrollment",
          courseId: String(course._id),
          courseTitle: course.title,
          learnerName: buyer.name,
          learnerEmail: buyer.email,
          billingAddress: buyerAddress
        }
      }
    );
    const response = await requestIntouchPayment({ amount: total, mobilePhone, requestTransactionId });

    if (!isPaymentRequestAccepted(response)) {
      await WalletTransaction.findByIdAndUpdate(transaction._id, {
        $set: {
          status: "failed",
          providerReference: response.data?.referenceno ?? response.data?.referenceid,
          metadata: { ...(transaction.metadata ?? {}), responseCode: response.code, responseMessage: response.message, response: response.data }
        }
      });
      throw new Error(response.message || "Mobile Money payment request failed.");
    }

    await WalletTransaction.findByIdAndUpdate(transaction._id, {
      $set: {
        providerReference: response.data?.referenceno ?? response.data?.referenceid,
        metadata: { ...(transaction.metadata ?? {}), responseCode: response.code, responseMessage: response.message, response: response.data }
      }
    });

    return { status: "pending", transaction, message: "Approve the MTN Mobile Money prompt to complete enrollment." };
  }

  const paypalAmount = usd(total, "FRW");
  const transaction = await recordWalletTransaction(
    { id: buyer.id, email: buyer.email, name: buyer.name, role: buyer.role },
    {
      type: "purchase",
      direction: "debit",
      amount: total,
      currency: "FRW",
      status: "pending",
      description: `PayPal course payment: ${course.title}`,
      referenceType: "enrollment",
      referenceId: createIntouchRequestId("MRC-PPC"),
      metadata: {
        affectsBalance: false,
        paymentMethod,
        payableType: "course_enrollment",
        courseId: String(course._id),
        courseTitle: course.title,
        learnerName: buyer.name,
        learnerEmail: buyer.email,
        billingAddress: buyerAddress,
        paypalAmount,
        paypalCurrency: paypalCurrency()
      }
    }
  );
  const paypal = await createPayPalOrder({
    amount: paypalAmount,
    description: `MR Creativist course ${course.title}`,
    referenceId: String(transaction._id),
    returnPath: `/api/payments/paypal?transactionId=${transaction._id}`,
    cancelPath: `/courses/${course.slug}/enroll?paypal=cancelled`
  });

  await WalletTransaction.findByIdAndUpdate(transaction._id, {
    $set: {
      providerReference: paypal.id,
      metadata: { ...(transaction.metadata ?? {}), paypalOrderId: paypal.id, approvalUrl: paypal.approvalUrl }
    }
  });

  return { status: "redirect", transaction, approvalUrl: paypal.approvalUrl, message: "Continue to PayPal to complete enrollment." };
}
