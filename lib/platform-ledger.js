import crypto from "node:crypto";
import mongoose from "mongoose";
import { sendEmail } from "@/lib/email";
import { envBoolean } from "@/lib/env";
import {
  callbackCode,
  callbackProviderTransactionId,
  callbackReferenceNo,
  callbackRequestTransactionId,
  callbackStatusMessage,
  createIntouchRequestId,
  formatRwandaMobilePhone,
  getIntouchBalance,
  getIntouchTransactionStatus,
  isDepositCompleted,
  isPaymentCompleted,
  isPaymentRequestAccepted,
  requestIntouchDeposit,
  requestIntouchPayment
} from "@/lib/intouchpay";
import { markOrderPaid, completeCourseEnrollmentPayment } from "@/lib/payment-finalization";
import { connectMongoDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import CertificateCredential from "@/models/CertificateCredential";
import ConsultingService from "@/models/ConsultingService";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import LearningProgress from "@/models/LearningProgress";
import FreelancerProfile from "@/models/FreelancerProfile";
import Message from "@/models/Message";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ReferralProfile from "@/models/ReferralProfile";
import UploadAsset from "@/models/UploadAsset";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import WorkspaceRecord from "@/models/WorkspaceRecord";

const CREDIT_TYPES = new Set([
  "deposit",
  "transfer_in",
  "refund",
  "course_earning",
  "product_earning",
  "consulting_earning",
  "freelance_earning",
  "referral_earning",
  "admin_adjustment"
]);

const rolePaths = {
  client: "/dashboard",
  student: "/dashboard/my-courses",
  user: "/dashboard",
  instructor: "/instructor",
  seller: "/seller",
  freelancer: "/freelancer",
  consultant: "/consultant"
};

function cleanJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function userObjectId(user) {
  const id = String(user?.id ?? "");
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

function userIdentity(user) {
  const email = normalizeEmail(user?.email);

  return {
    id: userObjectId(user),
    email,
    name: user?.name ?? email,
    role: user?.role ?? "client"
  };
}

function affectsBalance(transaction) {
  return transaction?.metadata?.affectsBalance !== false;
}

function signedAmount(transaction) {
  const amount = Number(transaction.amount ?? 0);
  return transaction.direction === "credit" ? amount : -amount;
}

function balanceImpact(transaction) {
  return affectsBalance(transaction) ? signedAmount(transaction) : 0;
}

function providerReference(response) {
  return String(response?.data?.referenceid ?? response?.data?.referenceno ?? response?.data?.referenceNo ?? "").trim();
}

function providerTransaction(response) {
  return String(response?.data?.transactionid ?? response?.data?.transactionId ?? "").trim();
}

async function sendWalletEmail(to, subject, text, html) {
  const email = normalizeEmail(to);
  if (!email) return null;

  try {
    return await sendEmail({ to: email, subject, text, html });
  } catch (error) {
    console.error("[wallet-email] Failed to send wallet email", error);
    return null;
  }
}

function transactionEmailBody({ title, lines, action }) {
  const text = [title, ...lines, action ? `Action: ${action}` : ""].filter(Boolean).join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin:0 0 12px">${title}</h2>
      ${lines.map((line) => `<p style="margin:0 0 8px">${line}</p>`).join("")}
      ${action ? `<p style="margin-top:18px;color:#475569">${action}</p>` : ""}
    </div>
  `;

  return { text, html };
}

function money(value, currency = "USD") {
  if (currency === "FRW") {
    return `FRW ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(Number(value ?? 0)))}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(Number(value ?? 0));
}

function compact(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value ?? 0));
}

function moduleFromPath(pathname, fallback = "workspace") {
  const parts = String(pathname ?? "")
    .split("/")
    .filter(Boolean);
  return parts.at(-1)?.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || fallback;
}

function publicTransaction(transaction) {
  const item = cleanJson(transaction);

  return {
    id: item._id ?? item.id,
    type: item.type,
    amount: signedAmount(item),
    rawAmount: item.amount,
    direction: item.direction,
    currency: item.currency,
    status: item.status,
    description: item.description,
    counterpartyEmail: item.counterpartyEmail,
    referenceType: item.referenceType,
    referenceId: item.referenceId,
    requestTransactionId: item.requestTransactionId,
    providerTransactionId: item.providerTransactionId,
    providerReference: item.providerReference,
    mobilePhone: item.mobilePhone,
    balanceAfter: item.balanceAfter,
    affectsBalance: item.metadata?.affectsBalance !== false,
    createdAt: item.createdAt
  };
}

function publicWorkspaceRecord(record) {
  const item = cleanJson(record);

  return {
    id: String(item._id ?? item.id),
    name: item.title,
    title: item.title,
    description: item.description,
    status: item.status,
    amount: item.amount,
    currency: item.currency,
    kind: item.kind,
    tags: item.tags ?? [],
    updatedAt: item.updatedAt ?? item.createdAt,
    activity: item.activity ?? []
  };
}

export async function latestBalance(userEmail, currency) {
  const filter = { userEmail };
  if (currency) filter.currency = currency;

  const transactions = await WalletTransaction.find(filter).sort({ createdAt: 1 }).lean();
  let available = 0;

  for (const transaction of transactions) {
    if (transaction.status === "completed") {
      available += balanceImpact(transaction);
    }

    if (transaction.status === "pending" && transaction.direction === "debit" && affectsBalance(transaction)) {
      available -= Number(transaction.amount ?? 0);
    }
  }

  return Math.max(0, Math.round(available * 100) / 100);
}

export async function recordWalletTransaction(user, input) {
  const identity = userIdentity(user);
  if (!identity.email) throw new Error("A user email is required for wallet transactions.");

  const amount = Math.max(0, Number(input.amount ?? 0));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Transaction amount must be greater than zero.");

  const type = input.type ?? "deposit";
  const direction = input.direction ?? (CREDIT_TYPES.has(type) ? "credit" : "debit");
  const currency = input.currency ?? "USD";
  const currentBalance = await latestBalance(identity.email, currency);
  const status = input.status ?? "completed";
  const metadata = input.metadata ?? {};
  const balanceAware = metadata.affectsBalance !== false;
  const reservePendingDebit = status === "pending" && direction === "debit" && balanceAware;
  const completedImpact = status === "completed" && balanceAware ? (direction === "credit" ? amount : -amount) : 0;
  const pendingImpact = reservePendingDebit ? -amount : 0;
  const balanceAfter =
    typeof input.balanceAfter === "number"
      ? input.balanceAfter
      : Math.max(0, Math.round((currentBalance + completedImpact + pendingImpact) * 100) / 100);

  return WalletTransaction.create({
    userId: identity.id,
    userEmail: identity.email,
    counterpartyId: input.counterpartyId,
    counterpartyEmail: normalizeEmail(input.counterpartyEmail),
    type,
    direction,
    amount,
    currency,
    status,
    balanceAfter,
    description: input.description ?? "Wallet transaction",
    referenceType: input.referenceType ?? "manual",
    referenceId: input.referenceId,
    requestTransactionId: input.requestTransactionId,
    providerTransactionId: input.providerTransactionId,
    providerReference: input.providerReference,
    mobilePhone: input.mobilePhone,
    metadata
  });
}

async function ensureWalletTransaction(user, input) {
  const identity = userIdentity(user);
  const referenceType = input.referenceType ?? "manual";
  const referenceId = String(input.referenceId ?? "");

  if (referenceType !== "manual" && referenceId) {
    const existing = await WalletTransaction.findOne({
      userEmail: identity.email,
      type: input.type,
      referenceType,
      referenceId
    });

    if (existing) return existing;
  }

  return recordWalletTransaction(user, { ...input, referenceType, referenceId });
}

async function finalizeWalletTransaction(transaction, status, patch = {}) {
  if (!transaction) return null;

  const amount = Number(transaction.amount ?? 0);
  const currentBalance = await latestBalance(transaction.userEmail, transaction.currency);
  let balanceAfter = currentBalance;

  if (status === "completed" && affectsBalance(transaction)) {
    balanceAfter =
      transaction.status === "pending" && transaction.direction === "debit"
        ? currentBalance
        : Math.max(0, Math.round((currentBalance + signedAmount(transaction)) * 100) / 100);
  }

  if ((status === "failed" || status === "cancelled") && transaction.status === "pending" && transaction.direction === "debit" && affectsBalance(transaction)) {
    balanceAfter = Math.max(0, Math.round((currentBalance + amount) * 100) / 100);
  }

  return WalletTransaction.findByIdAndUpdate(
    transaction._id,
    {
      $set: {
        status,
        balanceAfter,
        ...patch,
        metadata: {
          ...(transaction.metadata ?? {}),
          ...(patch.metadata ?? {})
        }
      }
    },
    { returnDocument: "after", runValidators: true }
  );
}

async function notifyTransaction(transaction, subject, extraLines = []) {
  if (!transaction?.userEmail || transaction.userEmail === "platform@mrcreativist.local") return null;

  const body = transactionEmailBody({
    title: subject,
    lines: [
      `Amount: ${money(transaction.amount, transaction.currency)}`,
      `Status: ${transaction.status}`,
      `Reference: ${transaction.referenceId ?? transaction.requestTransactionId ?? "N/A"}`,
      ...extraLines
    ]
  });

  return sendWalletEmail(transaction.userEmail, subject, body.text, body.html);
}

async function ensureReferralProfile(user) {
  const identity = userIdentity(user);
  if (!identity.email) return null;

  const local = identity.email.split("@")[0]?.replace(/[^a-z0-9]+/gi, "").slice(0, 8).toUpperCase() || "MRC";
  const code = `MRC-${local}`;

  return ReferralProfile.findOneAndUpdate(
    { userEmail: identity.email },
    {
      $setOnInsert: {
        userId: identity.id,
        userEmail: identity.email,
        code,
        metadata: { source: "auto-created" }
      }
    },
    { returnDocument: "after", upsert: true }
  ).lean();
}

async function seedCourseEarnings(user) {
  const identity = userIdentity(user);
  const courseFilter = [];

  if (identity.id) courseFilter.push({ instructorId: identity.id });
  if (identity.name) courseFilter.push({ instructorName: new RegExp(`^${escapeRegex(identity.name)}$`, "i") });

  if (!courseFilter.length) return;

  const courses = await Course.find({ $or: courseFilter }).select("_id title instructorName").lean();
  const courseIds = courses.map((course) => course._id);
  if (!courseIds.length) return;

  const courseTitles = new Map(courses.map((course) => [String(course._id), course.title]));
  const enrollments = await Enrollment.find({
    courseId: { $in: courseIds },
    paidAmount: { $gt: 0 },
    status: { $in: ["active", "completed"] }
  })
    .select("_id courseId paidAmount learnerEmail")
    .lean();

  await Promise.all(
    enrollments.map((enrollment) =>
      ensureWalletTransaction(user, {
        type: "course_earning",
        amount: Number(enrollment.paidAmount ?? 0) * 0.8,
        description: `Course earning: ${courseTitles.get(String(enrollment.courseId)) ?? "Course sale"}`,
        referenceType: "enrollment",
        referenceId: String(enrollment._id),
        metadata: { learnerEmail: enrollment.learnerEmail, grossAmount: enrollment.paidAmount, commissionRate: 0.2 }
      }).catch(() => null)
    )
  );
}

async function seedProductEarnings(user) {
  const identity = userIdentity(user);
  const productFilter = [];

  if (identity.id) productFilter.push({ sellerId: identity.id });
  if (identity.name) productFilter.push({ sellerName: new RegExp(`^${escapeRegex(identity.name)}$`, "i") });

  if (!productFilter.length) return;

  const products = await Product.find({ $or: productFilter }).select("_id name sellerName").lean();
  const productIds = products.map((product) => product._id);
  if (!productIds.length) return;

  const productNames = new Map(products.map((product) => [String(product._id), product.name]));
  const productIdSet = new Set(productIds.map(String));
  const orders = await Order.find({
    status: { $in: ["paid", "fulfilled"] },
    "items.productId": { $in: productIds }
  })
    .select("_id buyerEmail items currency")
    .lean();

  const writes = [];
  for (const order of orders) {
    for (const item of order.items ?? []) {
      const productId = String(item.productId);
      if (!productIdSet.has(productId)) continue;

      writes.push(
        ensureWalletTransaction(user, {
          type: "product_earning",
          amount: Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1) * 0.88,
          currency: order.currency ?? "USD",
          description: `Product earning: ${productNames.get(productId) ?? item.name ?? "Marketplace item"}`,
          referenceType: "order",
          referenceId: `${order._id}:${productId}`,
          metadata: { buyerEmail: order.buyerEmail, grossAmount: Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1), commissionRate: 0.12 }
        }).catch(() => null)
      );
    }
  }

  await Promise.all(writes);
}

async function seedConsultingEarnings(user) {
  const identity = userIdentity(user);
  const serviceFilter = [];

  if (identity.id) serviceFilter.push({ expertId: identity.id });
  if (identity.name) serviceFilter.push({ expertName: new RegExp(`^${escapeRegex(identity.name)}$`, "i") });

  if (!serviceFilter.length) return;

  const services = await ConsultingService.find({ $or: serviceFilter }).select("_id title hourlyRate sessionTypes").lean();
  const serviceIds = services.map((service) => service._id);
  if (!serviceIds.length) return;

  const servicesById = new Map(services.map((service) => [String(service._id), service]));
  const bookings = await Booking.find({
    serviceId: { $in: serviceIds },
    status: { $in: ["confirmed", "completed"] }
  })
    .select("_id serviceId sessionType clientEmail status")
    .lean();

  await Promise.all(
    bookings.map((booking) => {
      const service = servicesById.get(String(booking.serviceId));
      const sessionType = service?.sessionTypes?.find((item) => item.label === booking.sessionType);
      const amount = Number(sessionType?.price ?? service?.hourlyRate ?? 0) * 0.85;

      return ensureWalletTransaction(user, {
        type: "consulting_earning",
        amount,
        description: `Consulting earning: ${service?.title ?? booking.sessionType}`,
        referenceType: "booking",
        referenceId: String(booking._id),
        metadata: { clientEmail: booking.clientEmail, grossAmount: sessionType?.price ?? service?.hourlyRate, commissionRate: 0.15 }
      }).catch(() => null);
    })
  );
}

async function seedFreelanceEarnings(user) {
  const identity = userIdentity(user);
  const completed = await WorkspaceRecord.find({
    userEmail: identity.email,
    pathname: /^\/freelancer/,
    amount: { $gt: 0 },
    status: { $in: ["approved", "completed"] }
  })
    .select("_id title amount currency")
    .lean();

  await Promise.all(
    completed.map((record) =>
      ensureWalletTransaction(user, {
        type: "freelance_earning",
        amount: Number(record.amount ?? 0) * 0.9,
        currency: record.currency ?? "USD",
        description: `Freelance earning: ${record.title}`,
        referenceType: "workspace",
        referenceId: String(record._id),
        metadata: { grossAmount: record.amount, commissionRate: 0.1 }
      }).catch(() => null)
    )
  );
}

async function seedWalletPurchases(user) {
  const identity = userIdentity(user);
  if (!identity.email) return;

  const orders = await Order.find({
    buyerEmail: identity.email,
    paymentMethod: /wallet/i,
    status: { $in: ["paid", "fulfilled"] },
    total: { $gt: 0 }
  })
    .select("_id total currency")
    .lean();

  await Promise.all(
    orders.map((order) =>
      ensureWalletTransaction(user, {
        type: "purchase",
        amount: Number(order.total ?? 0),
        currency: order.currency ?? "USD",
        description: "Wallet purchase",
        referenceType: "order",
        referenceId: String(order._id),
        metadata: { orderId: String(order._id) }
      }).catch(() => null)
    )
  );
}

async function seedWalletFromPlatform(user) {
  await connectMongoDB();
  await ensureReferralProfile(user);
  await Promise.all([
    seedWalletPurchases(user),
    seedCourseEarnings(user),
    seedProductEarnings(user),
    seedConsultingEarnings(user),
    seedFreelanceEarnings(user)
  ]);
}

export async function getWalletSnapshot(user) {
  if (envBoolean("WALLET_AUTO_SEED_EARNINGS", false)) {
    await seedWalletFromPlatform(user);
  } else {
    await connectMongoDB();
  }

  const identity = userIdentity(user);
  const transactions = await WalletTransaction.find({ userEmail: identity.email }).sort({ createdAt: -1 }).limit(80).lean();
  const walletCurrency = transactions.length && !transactions.some((transaction) => transaction.currency === "FRW") ? "USD" : "FRW";
  let balance = 0;
  let pendingBalance = 0;
  let totalEarned = 0;
  let totalWithdrawn = 0;

  for (const transaction of transactions.toReversed()) {
    if (transaction.currency !== walletCurrency) continue;

    const amount = Number(transaction.amount ?? 0);
    if (transaction.status === "completed") {
      balance += balanceImpact(transaction);
      if (transaction.direction === "credit") totalEarned += amount;
      if (transaction.direction === "debit") totalWithdrawn += amount;
    }

    if (transaction.status === "pending" && transaction.direction === "debit" && affectsBalance(transaction)) {
      balance -= amount;
      pendingBalance += amount;
      totalWithdrawn += amount;
    }
  }

  return {
    balance: Math.max(0, Math.round(balance * 100) / 100),
    pendingBalance: Math.round(pendingBalance * 100) / 100,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
    currency: walletCurrency,
    transactions: transactions.map(publicTransaction)
  };
}

export async function handleWalletAction(user, body) {
  await connectMongoDB();

  const action = String(body?.action ?? "deposit").toLowerCase();
  const amount = Math.max(0, Number(body?.amount ?? 0));
  const currency = body?.currency === "USD" ? "USD" : "FRW";
  const recipientEmail = normalizeEmail(body?.recipientEmail ?? body?.recipient);
  const identity = userIdentity(user);
  const availableBalance = await latestBalance(identity.email);

  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");

  if (action === "transfer") {
    if (!recipientEmail) throw new Error("Recipient email is required for transfers.");
    if (recipientEmail === identity.email) throw new Error("You cannot transfer funds to your own wallet.");
    if (availableBalance < amount) throw new Error("Insufficient wallet balance for this transfer.");

    const recipient = await User.findOne({ email: recipientEmail }).select("_id email name role").lean();
    const referenceId = crypto.randomUUID();

    const outgoing = await recordWalletTransaction(user, {
      type: "transfer_out",
      amount,
      currency,
      counterpartyId: recipient?._id,
      counterpartyEmail: recipientEmail,
      description: `Transfer to ${recipientEmail}`,
      referenceType: "transfer",
      referenceId,
      metadata: { channel: "wallet-email-transfer" }
    });

    const incoming = await recordWalletTransaction(
      { id: recipient?._id ? String(recipient._id) : undefined, email: recipientEmail, name: recipient?.name, role: recipient?.role },
      {
        type: "transfer_in",
        amount,
        currency,
        counterpartyId: userObjectId(user),
        counterpartyEmail: user?.email,
        description: `Transfer from ${user?.email ?? "MR Creativist user"}`,
        referenceType: "transfer",
        referenceId,
        metadata: { channel: "wallet-email-transfer" }
      }
    );

    await Promise.all([
      notifyTransaction(outgoing, "MR Creativist wallet transfer sent", [`Recipient: ${recipientEmail}`]),
      notifyTransaction(incoming, "MR Creativist wallet transfer received", [`Sender: ${identity.email}`])
    ]);

    return getWalletSnapshot(user);
  }

  if (action === "deposit") {
    const mobilePhone = formatRwandaMobilePhone(body?.mobilePhone ?? body?.mobile ?? body?.phone ?? "");
    if (!mobilePhone) throw new Error("MTN Mobile Money phone number is required for Intouch deposits.");

    const requestTransactionId = createIntouchRequestId("MRC-RCV");
    const transaction = await recordWalletTransaction(user, {
      type: "deposit",
      direction: "credit",
      amount,
      currency: "FRW",
      status: "pending",
      description: `MTN Mobile Money deposit request from ${mobilePhone}`,
      referenceType: "intouchpay",
      referenceId: requestTransactionId,
      requestTransactionId,
      mobilePhone,
      metadata: {
        provider: "intouchpay",
        method: "mtn_momo",
        action: "requestpayment"
      }
    });

    let providerFailureRecorded = false;
    try {
      const response = await requestIntouchPayment({ amount, mobilePhone, requestTransactionId });
      const patch = {
        providerTransactionId: providerTransaction(response),
        providerReference: providerReference(response),
        metadata: {
          provider: "intouchpay",
          method: "mtn_momo",
          action: "requestpayment",
          responseCode: response.code,
          responseMessage: response.message,
          response: response.data
        }
      };

      if (!isPaymentRequestAccepted(response)) {
        await finalizeWalletTransaction(transaction, "failed", patch);
        providerFailureRecorded = true;
        throw new Error(response.message || "IntouchPay did not accept the deposit request.");
      }

      const updated = await WalletTransaction.findByIdAndUpdate(transaction._id, { $set: patch }, { returnDocument: "after" });
      await notifyTransaction(updated, "MR Creativist deposit request started", [
        "Approve the MTN Mobile Money prompt on your phone to complete the wallet deposit."
      ]);

      return getWalletSnapshot(user);
    } catch (error) {
      if (!providerFailureRecorded) {
        await finalizeWalletTransaction(transaction, "failed", {
          metadata: {
            provider: "intouchpay",
            method: "mtn_momo",
            action: "requestpayment",
            error: error instanceof Error ? error.message : "IntouchPay deposit request failed."
          }
        });
      }
      throw error;
    }
  }

  if (action === "withdraw" || action === "withdrawal") {
    const mobilePhone = formatRwandaMobilePhone(body?.mobilePhone ?? body?.mobile ?? body?.phone ?? "");
    if (!mobilePhone) throw new Error("MTN Mobile Money phone number is required for Intouch withdrawals.");
    if (availableBalance < amount) throw new Error("Insufficient wallet balance for this withdrawal.");

    const requestTransactionId = createIntouchRequestId("MRC-SND");
    const transaction = await recordWalletTransaction(user, {
      type: "withdrawal",
      direction: "debit",
      amount,
      currency: "FRW",
      status: "pending",
      description: body?.description ?? `MTN Mobile Money payout to ${mobilePhone}`,
      referenceType: "withdrawal",
      referenceId: requestTransactionId,
      requestTransactionId,
      mobilePhone,
      metadata: {
        provider: "intouchpay",
        method: "mtn_momo",
        action: "requestdeposit"
      }
    });

    let providerFailureRecorded = false;
    try {
      const response = await requestIntouchDeposit({
        amount,
        mobilePhone,
        reason: body?.description ?? "MR Creativist wallet withdrawal",
        requestTransactionId
      });
      const patch = {
        providerTransactionId: providerTransaction(response),
        providerReference: providerReference(response),
        metadata: {
          provider: "intouchpay",
          method: "mtn_momo",
          action: "requestdeposit",
          responseCode: response.code,
          responseMessage: response.message,
          response: response.data
        }
      };

      if (!isDepositCompleted(response)) {
        await finalizeWalletTransaction(transaction, "failed", patch);
        providerFailureRecorded = true;
        throw new Error(response.message || "IntouchPay did not complete the withdrawal.");
      }

      const updated = await finalizeWalletTransaction(transaction, "completed", patch);
      await notifyTransaction(updated, "MR Creativist withdrawal sent", [`Mobile money number: ${mobilePhone}`]);

      return getWalletSnapshot(user);
    } catch (error) {
      if (!providerFailureRecorded) {
        await finalizeWalletTransaction(transaction, "failed", {
          metadata: {
            provider: "intouchpay",
            method: "mtn_momo",
            action: "requestdeposit",
            error: error instanceof Error ? error.message : "IntouchPay withdrawal failed."
          }
        });
      }
      throw error;
    }
  }

  const transactionMap = {
    purchase: { type: "purchase", status: "completed", description: body?.description ?? "Wallet purchase" },
    refund: { type: "refund", status: "completed", description: body?.description ?? "Wallet refund" }
  };

  const next = transactionMap[action];
  if (!next) throw new Error("Unsupported wallet action.");
  if (next.type === "purchase" && availableBalance < amount) throw new Error("Insufficient wallet balance for this purchase.");

  const transaction = await recordWalletTransaction(user, {
    ...next,
    amount,
    currency,
    description: body?.description ?? next.description,
    referenceType: "manual",
    referenceId: body?.referenceId
  });

  await notifyTransaction(transaction, `MR Creativist wallet ${transaction.type.replaceAll("_", " ")}`);
  return getWalletSnapshot(user);
}

function adminTransaction(transaction) {
  const item = cleanJson(transaction);

  return {
    ...publicTransaction(item),
    userEmail: item.userEmail,
    counterpartyEmail: item.counterpartyEmail,
    metadata: item.metadata ?? {}
  };
}

function adminFinanceFilter(options = {}) {
  const filter = {};
  const status = String(options.status ?? "all").toLowerCase();
  const type = String(options.type ?? "all").toLowerCase();
  const search = String(options.search ?? "").trim();

  if (status !== "all") filter.status = status;
  if (type !== "all") filter.type = type;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { userEmail: pattern },
      { counterpartyEmail: pattern },
      { description: pattern },
      { referenceId: pattern },
      { requestTransactionId: pattern },
      { providerTransactionId: pattern },
      { providerReference: pattern },
      { mobilePhone: pattern }
    ];
  }

  return filter;
}

async function financeTotals(filter) {
  const rows = await WalletTransaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          currency: "$currency",
          direction: "$direction",
          status: "$status"
        },
        amount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    count: 0,
    receivedFrw: 0,
    sentFrw: 0,
    pendingFrw: 0,
    failed: 0,
    completed: 0
  };

  for (const row of rows) {
    const currency = row._id.currency;
    const direction = row._id.direction;
    const status = row._id.status;
    const amount = Number(row.amount ?? 0);
    const count = Number(row.count ?? 0);

    summary.count += count;
    if (status === "failed") summary.failed += count;
    if (status === "completed") summary.completed += count;
    if (currency !== "FRW") continue;
    if (status === "pending") summary.pendingFrw += amount;
    if (status === "completed" && direction === "credit") summary.receivedFrw += amount;
    if (status === "completed" && direction === "debit") summary.sentFrw += amount;
  }

  return summary;
}

export async function getAdminFinanceSnapshot(options = {}) {
  await connectMongoDB();

  const filter = adminFinanceFilter(options);
  const [transactions, summary] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1 }).limit(150).lean(),
    financeTotals(filter)
  ]);

  return {
    summary,
    transactions: transactions.map(adminTransaction),
    filters: {
      status: options.status ?? "all",
      type: options.type ?? "all",
      search: options.search ?? ""
    },
    updatedAt: new Date().toISOString()
  };
}

export async function getAdminIntouchBalance() {
  return getIntouchBalance();
}

export async function sendAdminPayment(adminUser, body) {
  await connectMongoDB();

  const amount = Math.max(0, Number(body?.amount ?? 0));
  const mobilePhone = formatRwandaMobilePhone(body?.mobilePhone ?? body?.mobile ?? body?.phone ?? "");
  const recipientEmail = normalizeEmail(body?.recipientEmail ?? body?.email);
  const reason = String(body?.reason ?? body?.description ?? "MR Creativist admin payout").trim();
  const adminEmail = normalizeEmail(adminUser?.email);

  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (!mobilePhone) throw new Error("Recipient MTN Mobile Money phone number is required.");

  const requestTransactionId = createIntouchRequestId("MRC-ADM");
  const transaction = await recordWalletTransaction(
    { email: "platform@mrcreativist.local", name: "MR Creativist Finance", role: "admin" },
    {
      type: "admin_payout",
      direction: "debit",
      amount,
      currency: "FRW",
      status: "pending",
      counterpartyEmail: recipientEmail,
      description: reason,
      referenceType: "admin_payment",
      referenceId: requestTransactionId,
      requestTransactionId,
      mobilePhone,
      metadata: {
        provider: "intouchpay",
        method: "mtn_momo",
        action: "admin-requestdeposit",
        affectsBalance: false,
        initiatedBy: adminEmail
      }
    }
  );

  let providerFailureRecorded = false;
  try {
    const response = await requestIntouchDeposit({
      amount,
      mobilePhone,
      reason,
      requestTransactionId
    });
    const patch = {
      providerTransactionId: providerTransaction(response),
      providerReference: providerReference(response),
      metadata: {
        provider: "intouchpay",
        method: "mtn_momo",
        action: "admin-requestdeposit",
        affectsBalance: false,
        initiatedBy: adminEmail,
        recipientEmail,
        responseCode: response.code,
        responseMessage: response.message,
        response: response.data
      }
    };

    if (!isDepositCompleted(response)) {
      await finalizeWalletTransaction(transaction, "failed", patch);
      providerFailureRecorded = true;
      throw new Error(response.message || "IntouchPay did not complete the admin payment.");
    }

    const completed = await finalizeWalletTransaction(transaction, "completed", patch);
    const bodyMessage = transactionEmailBody({
      title: "MR Creativist payment sent",
      lines: [
        `Amount: ${money(amount, "FRW")}`,
        `Mobile money number: ${mobilePhone}`,
        `Reference: ${completed.referenceId}`
      ]
    });

    await Promise.all([
      recipientEmail ? sendWalletEmail(recipientEmail, "MR Creativist payment sent", bodyMessage.text, bodyMessage.html) : null,
      adminEmail ? sendWalletEmail(adminEmail, "Admin payment completed", bodyMessage.text, bodyMessage.html) : null
    ]);

    return adminTransaction(completed);
  } catch (error) {
    if (!providerFailureRecorded) {
      await finalizeWalletTransaction(transaction, "failed", {
        metadata: {
          provider: "intouchpay",
          method: "mtn_momo",
          action: "admin-requestdeposit",
          affectsBalance: false,
          initiatedBy: adminEmail,
          recipientEmail,
          error: error instanceof Error ? error.message : "IntouchPay admin payment failed."
        }
      });
    }
    throw error;
  }
}

export async function applyIntouchCallback(payload) {
  await connectMongoDB();

  const requestTransactionId = callbackRequestTransactionId(payload);
  if (!requestTransactionId) {
    throw new Error("IntouchPay callback is missing requesttransactionid.");
  }

  const transaction = await WalletTransaction.findOne({
    $or: [{ requestTransactionId }, { referenceId: requestTransactionId }]
  });

  if (!transaction) {
    throw new Error(`No wallet transaction found for IntouchPay request ${requestTransactionId}.`);
  }

  if (transaction.status === "completed") {
    return adminTransaction(transaction);
  }

  const code = callbackCode(payload);
  const completed = isPaymentCompleted({ code, ok: true, message: "", data: {}, raw: "" });
  const status = completed ? "completed" : "failed";
  const updated = await finalizeWalletTransaction(transaction, status, {
    providerTransactionId: callbackProviderTransactionId(payload),
    providerReference: callbackReferenceNo(payload),
    metadata: {
      ...(transaction.metadata ?? {}),
      callbackCode: code,
      callbackMessage: callbackStatusMessage(payload),
      callbackPayload: payload
    }
  });

  if (completed && updated?.metadata?.payableType === "order") {
    await markOrderPaid(String(updated.referenceId), {
      transactionId: String(updated._id),
      paymentReference: updated.providerReference || updated.requestTransactionId,
      providerTransactionId: updated.providerTransactionId
    });
  }

  if (completed && updated?.metadata?.payableType === "course_enrollment") {
    await completeCourseEnrollmentPayment(updated.toObject ? updated.toObject() : updated, {
      transactionId: String(updated._id)
    });
  }

  const payableType = updated?.metadata?.payableType;
  const completedSubject =
    payableType === "order"
      ? "MR Creativist order payment completed"
      : payableType === "course_enrollment"
        ? "MR Creativist course payment completed"
        : "MR Creativist deposit completed";
  const failedSubject =
    payableType === "order"
      ? "MR Creativist order payment failed"
      : payableType === "course_enrollment"
        ? "MR Creativist course payment failed"
        : "MR Creativist deposit failed";

  await notifyTransaction(updated, completed ? completedSubject : failedSubject, [callbackStatusMessage(payload)].filter(Boolean));

  return adminTransaction(updated);
}

export async function refreshIntouchTransactionStatus(referenceId) {
  await connectMongoDB();

  if (!referenceId) throw new Error("A transaction reference is required.");

  const transaction = await WalletTransaction.findOne({
    $or: [{ requestTransactionId: referenceId }, { referenceId }]
  });

  if (!transaction) throw new Error("Transaction not found.");
  if (!transaction.requestTransactionId && !transaction.providerTransactionId) {
    throw new Error("This transaction does not have an IntouchPay reference.");
  }

  const response = await getIntouchTransactionStatus({
    requestTransactionId: transaction.requestTransactionId,
    transactionId: transaction.providerTransactionId
  });
  const completed =
    transaction.type === "withdrawal" || transaction.type === "admin_payout"
      ? isDepositCompleted(response)
      : isPaymentCompleted(response);

  if (!completed && response.code === "1000") {
    const updated = await WalletTransaction.findByIdAndUpdate(
      transaction._id,
      {
        $set: {
          providerTransactionId: providerTransaction(response),
          providerReference: providerReference(response),
          metadata: {
            ...(transaction.metadata ?? {}),
            lastStatusCode: response.code,
            lastStatusMessage: response.message,
            lastStatusResponse: response.data,
            lastStatusCheckedAt: new Date()
          }
        }
      },
      { returnDocument: "after" }
    );

    return adminTransaction(updated);
  }

  const updated = await finalizeWalletTransaction(transaction, completed ? "completed" : "failed", {
    providerTransactionId: providerTransaction(response),
    providerReference: providerReference(response),
    metadata: {
      ...(transaction.metadata ?? {}),
      lastStatusCode: response.code,
      lastStatusMessage: response.message,
      lastStatusResponse: response.data,
      lastStatusCheckedAt: new Date()
    }
  });

  return adminTransaction(updated);
}

export async function getWorkspaceSnapshot(user, options) {
  await connectMongoDB();

  const identity = userIdentity(user);
  const pathname = options.pathname ?? rolePaths[identity.role] ?? "/dashboard";
  const title = options.title ?? "Workspace";
  const moduleName = moduleFromPath(pathname, title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

  const records = await WorkspaceRecord.find({ userEmail: identity.email, pathname }).sort({ updatedAt: -1 }).limit(24);

  const latest = records[0]?.activity?.at(-1);

  return {
    pathname,
    title,
    module: moduleName,
    activity: latest?.action ? `${latest.action} recorded` : "No workspace records yet",
    records: records.map(publicWorkspaceRecord)
  };
}

export async function recordWorkspaceAction(user, body) {
  await connectMongoDB();

  const identity = userIdentity(user);
  const pathname = body.pathname ?? rolePaths[identity.role] ?? "/dashboard";
  const title = body.title ?? "Workspace";
  const moduleName = moduleFromPath(pathname, title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const action = String(body.action ?? "Update");
  const recordId = String(body.recordId ?? "");
  const actor = identity.email;

  if (recordId && mongoose.Types.ObjectId.isValid(recordId)) {
    const status =
      action.toLowerCase().includes("remove") || action.toLowerCase().includes("archive")
        ? "archived"
        : action.toLowerCase().includes("approve")
          ? "approved"
          : action.toLowerCase().includes("complete")
            ? "completed"
            : "active";

    const editablePatch =
      action.toLowerCase().includes("edit")
        ? {
            ...(body.name || body.title ? { title: body.name ?? body.title } : {}),
            ...(body.description ? { description: body.description } : {}),
            ...(body.kind ? { kind: body.kind } : {}),
            ...(Array.isArray(body.tags) ? { tags: body.tags } : {}),
            ...(typeof body.amount !== "undefined" ? { amount: Math.max(0, Number(body.amount ?? 0)) } : {}),
            ...(body.currency ? { currency: body.currency } : {})
          }
        : {};

    await WorkspaceRecord.findOneAndUpdate(
      { _id: recordId, userEmail: identity.email },
      {
        $set: { status, ...editablePatch },
        $push: { activity: { action, actorEmail: actor, note: body.note ?? `${action} from workspace UI.` } }
      },
      { returnDocument: "after" }
    );

    return getWorkspaceSnapshot(user, { pathname, title, tags: body.tags });
  }

  if (action.toLowerCase().includes("create") || action.toLowerCase().includes("add")) {
    await WorkspaceRecord.create({
      userId: identity.id,
      userEmail: identity.email,
      role: identity.role,
      pathname,
      module: moduleName,
      title: body.name ?? `${title} record`,
      description: body.description ?? `${title} item created from the workspace.`,
      kind: body.kind ?? "record",
      status: body.status ?? "draft",
      amount: Math.max(0, Number(body.amount ?? 0)),
      currency: body.currency ?? "USD",
      tags: body.tags ?? [],
      activity: [{ action, actorEmail: actor, note: body.note ?? "Created from workspace UI." }],
      metadata: body.metadata ?? {}
    });
  } else {
    const first = await WorkspaceRecord.findOne({ userEmail: identity.email, pathname }).sort({ updatedAt: -1 });
    if (first) {
      first.status = action.toLowerCase().includes("review") ? "needs_review" : "active";
      first.activity.push({ action, actorEmail: actor, note: body.note ?? `${action} from workspace UI.` });
      await first.save();
    }
  }

  return getWorkspaceSnapshot(user, { pathname, title, tags: body.tags });
}

async function countOpenMessages(identity) {
  const filters = [];
  if (identity.id) filters.push({ receiverId: identity.id, readAt: null });
  if (!filters.length) return 0;
  return Message.countDocuments({ $or: filters });
}

async function userLearningStats(identity) {
  const enrollmentFilter = identity.id
    ? { $or: [{ userId: identity.id }, { learnerEmail: identity.email }] }
    : { learnerEmail: identity.email };
  const [enrollments, certificates, orders, uploads, openMessages] = await Promise.all([
    Enrollment.find(enrollmentFilter).select("progressPercent certificateIssuedAt status paidAmount").lean(),
    CertificateCredential.countDocuments({ userEmail: identity.email, status: "issued" }),
    Order.countDocuments({ buyerEmail: identity.email }),
    UploadAsset.countDocuments({ userId: identity.id }),
    countOpenMessages(identity)
  ]);
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((total, item) => total + Number(item.progressPercent ?? 0), 0) / enrollments.length)
    : 0;
  const issuedCertificates = certificates + enrollments.filter((item) => item.certificateIssuedAt).length;

  return { enrollments, averageProgress, issuedCertificates, orderCount: orders, uploadCount: uploads, openMessages };
}

async function instructorStats(identity) {
  const courseFilter = [];
  if (identity.id) courseFilter.push({ instructorId: identity.id });
  if (identity.name) courseFilter.push({ instructorName: new RegExp(`^${escapeRegex(identity.name)}$`, "i") });
  const courses = courseFilter.length ? await Course.find({ $or: courseFilter }).select("_id status enrolledCount").lean() : [];
  const courseIds = courses.map((course) => course._id);
  const [enrollments, reviewRecords] = await Promise.all([
    courseIds.length
      ? Enrollment.find({ courseId: { $in: courseIds } }).select("progressPercent status").lean()
      : [],
    WorkspaceRecord.countDocuments({ userEmail: identity.email, pathname: /^\/instructor/, status: "needs_review" })
  ]);
  const completionRate = enrollments.length
    ? Math.round(enrollments.reduce((total, item) => total + Number(item.progressPercent ?? 0), 0) / enrollments.length)
    : 0;

  return { courseCount: courses.length, activeStudents: enrollments.length, completionRate, reviewRecords };
}

async function sellerStats(identity) {
  const productFilter = [];
  if (identity.id) productFilter.push({ sellerId: identity.id });
  if (identity.name) productFilter.push({ sellerName: new RegExp(`^${escapeRegex(identity.name)}$`, "i") });
  const products = productFilter.length ? await Product.find({ $or: productFilter }).select("_id stock status").lean() : [];
  const productIds = products.map((product) => product._id);
  const orders = productIds.length
    ? await Order.find({ "items.productId": { $in: productIds }, status: { $in: ["paid", "fulfilled", "pending"] } })
        .select("_id status items")
        .lean()
    : [];
  const lowStock = products.filter((product) => Number(product.stock ?? 0) <= 3).length;

  return { productCount: products.length, orderCount: orders.length, lowStock };
}

async function consultantStats(identity) {
  const serviceFilter = [];
  if (identity.id) serviceFilter.push({ expertId: identity.id });
  if (identity.name) serviceFilter.push({ expertName: new RegExp(`^${escapeRegex(identity.name)}$`, "i") });
  const services = serviceFilter.length ? await ConsultingService.find({ $or: serviceFilter }).select("_id rating").lean() : [];
  const serviceIds = services.map((service) => service._id);
  const bookings = serviceIds.length
    ? await Booking.find({ serviceId: { $in: serviceIds } }).select("status scheduledFor").lean()
    : [];
  const upcoming = bookings.filter((booking) => new Date(booking.scheduledFor).getTime() >= Date.now()).length;
  const rating = services.length
    ? (services.reduce((total, service) => total + Number(service.rating ?? 0), 0) / services.length).toFixed(1)
    : "0.0";

  return { serviceCount: services.length, bookingCount: bookings.length, upcoming, rating };
}

async function freelancerStats(identity) {
  const profileFilter = [];
  if (identity.id) profileFilter.push({ userId: identity.id });
  if (identity.name) profileFilter.push({ name: new RegExp(`^${escapeRegex(identity.name)}$`, "i") });
  const profiles = profileFilter.length ? await FreelancerProfile.find({ $or: profileFilter }).select("gigs completedJobs portfolioScore rating").lean() : [];
  const gigs = profiles.reduce((total, profile) => total + (profile.gigs?.length ?? 0), 0);
  const completedJobs = profiles.reduce((total, profile) => total + Number(profile.completedJobs ?? 0), 0);
  const contracts = await WorkspaceRecord.countDocuments({ userEmail: identity.email, pathname: /^\/freelancer\/contracts/ });

  return { profileCount: profiles.length, gigs, completedJobs, contracts };
}

function revenueFromWallet(wallet, types) {
  return wallet.transactions
    .filter((transaction) => types.includes(transaction.type) && transaction.status === "completed")
    .reduce((total, transaction) => total + Math.max(0, Number(transaction.amount ?? 0)), 0);
}

export async function getRoleDashboardData(role, user) {
  await connectMongoDB();
  const identity = userIdentity(user);
  const wallet = await getWalletSnapshot(user);
  const referral = await ensureReferralProfile(user);
  const records = await WorkspaceRecord.find({ userEmail: identity.email }).sort({ updatedAt: -1 }).limit(6).lean();
  const learning = await userLearningStats(identity);
  const metrics = {};

  if (["user", "client", "student"].includes(role)) {
    metrics["Learning progress"] = { value: `${learning.averageProgress}%`, trend: `${learning.enrollments.length} active enrollments` };
    metrics["Wallet balance"] = { value: money(wallet.balance), trend: `${wallet.transactions.length} ledger records` };
    metrics["Certificates"] = { value: String(learning.issuedCertificates), trend: `${learning.uploadCount} saved downloads/assets` };
    metrics["Open support"] = { value: String(learning.openMessages), trend: "Unread account messages" };
    metrics["Client bookings"] = { value: String(await Booking.countDocuments({ clientEmail: identity.email })), trend: "Consulting requests and sessions" };
    metrics["Orders"] = { value: String(learning.orderCount), trend: "Course, product, and service purchases" };
  }

  if (role === "instructor") {
    const stats = await instructorStats(identity);
    metrics["Course revenue"] = { value: money(revenueFromWallet(wallet, ["course_earning"])), trend: `${stats.courseCount} courses tracked` };
    metrics["Active students"] = { value: compact(stats.activeStudents), trend: `${stats.reviewRecords} records need review` };
    metrics["Completion rate"] = { value: `${stats.completionRate}%`, trend: "Average learner progress" };
    metrics["Pending grading"] = { value: String(stats.reviewRecords), trend: "Assignments, quizzes, and reviews" };
  }

  if (role === "seller") {
    const stats = await sellerStats(identity);
    metrics["Store revenue"] = { value: money(revenueFromWallet(wallet, ["product_earning"])), trend: `${stats.productCount} products tracked` };
    metrics["Open orders"] = { value: String(stats.orderCount), trend: "Paid, pending, and fulfilled orders" };
    metrics["Conversion"] = { value: stats.productCount ? `${Math.min(100, Math.round((stats.orderCount / stats.productCount) * 10))}%` : "0%", trend: "Orders per active product" };
    metrics["Low stock"] = { value: String(stats.lowStock), trend: "Products at or below 3 units" };
  }

  if (role === "consultant") {
    const stats = await consultantStats(identity);
    metrics["Consulting revenue"] = { value: money(revenueFromWallet(wallet, ["consulting_earning"])), trend: `${stats.serviceCount} services tracked` };
    metrics["Bookings"] = { value: String(stats.bookingCount), trend: `${stats.upcoming} upcoming sessions` };
    metrics["Client rating"] = { value: stats.rating, trend: "Average consulting service rating" };
    metrics["Payout ready"] = { value: money(wallet.balance), trend: "Available wallet balance" };
  }

  if (role === "freelancer") {
    const stats = await freelancerStats(identity);
    metrics["Freelance revenue"] = { value: money(revenueFromWallet(wallet, ["freelance_earning"])), trend: `${stats.contracts} contract records` };
    metrics["Gigs"] = { value: String(stats.gigs), trend: `${stats.profileCount} public profiles` };
    metrics["Completed jobs"] = { value: String(stats.completedJobs), trend: "Profile performance" };
    metrics["Payout ready"] = { value: money(wallet.balance), trend: "Available wallet balance" };
  }

  return {
    wallet,
    referral: referral ? cleanJson(referral) : null,
    metrics,
    records: records.map(publicWorkspaceRecord)
  };
}

function certificateCode(courseSlug) {
  const stem = String(courseSlug ?? "mrc").replace(/[^a-z0-9]+/gi, "").slice(0, 4).toUpperCase() || "MRC";
  return `MRC-${stem}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;
}

function publicCertificate(certificate) {
  const item = cleanJson(certificate);

  return {
    id: String(item._id ?? item.id),
    courseSlug: item.courseSlug,
    courseTitle: item.courseTitle,
    verificationCode: item.verificationCode,
    issuedAt: item.issuedAt ?? item.createdAt,
    template: item.template,
    status: item.status
  };
}

export async function getCertificateCredentials(user) {
  await connectMongoDB();
  const identity = userIdentity(user);

  const certificates = await CertificateCredential.find({ userEmail: identity.email, status: "issued" })
    .sort({ issuedAt: -1 })
    .lean();

  return certificates.map(publicCertificate);
}

export async function getCertificateCourseCatalog(user) {
  await connectMongoDB();
  const identity = userIdentity(user);
  const [enrollments, learningRecords] = await Promise.all([
    Enrollment.find({ learnerEmail: identity.email }).select("courseId progressPercent status certificateIssuedAt").lean(),
    LearningProgress.find({ learnerEmail: identity.email }).select("courseId progressPercent status certificateIssuedAt").lean()
  ]);
  const progressByCourse = new Map();
  const courseIds = [];

  for (const record of [...enrollments, ...learningRecords]) {
    if (!record.courseId) continue;
    const id = String(record.courseId);
    const previous = progressByCourse.get(id) ?? { progress: 0, completed: false, certificateIssuedAt: null };
    const progress = Math.max(previous.progress, Number(record.progressPercent ?? 0));

    progressByCourse.set(id, {
      progress,
      completed: previous.completed || record.status === "completed" || progress >= 100,
      certificateIssuedAt: previous.certificateIssuedAt ?? record.certificateIssuedAt ?? null
    });
    courseIds.push(record.courseId);
  }

  if (!courseIds.length) return [];

  const courses = await Course.find({ _id: { $in: courseIds }, status: { $ne: "archived" } }).lean();

  return courses.map((course) => {
    const normalized = normalizeCourseForCertificate(course);
    const progress = progressByCourse.get(String(course._id));

    return {
      ...normalized,
      progress: Math.max(Number(normalized.progress ?? 0), Number(progress?.progress ?? 0)),
      status: progress?.completed ? "completed" : normalized.status,
      certificateIssuedAt: progress?.certificateIssuedAt
    };
  });
}

function normalizeCourseForCertificate(course) {
  const modules = course.modules ?? [];
  const lessonsCount = course.lessonsCount ?? modules.reduce((total, module) => total + (module.lessons?.length ?? 0), 0);
  const totalMinutes = modules.reduce(
    (total, module) => total + (module.lessons ?? []).reduce((inner, lesson) => inner + Number(lesson.durationMinutes ?? 0), 0),
    0
  );

  return {
    id: String(course._id ?? course.id ?? course.slug),
    title: course.title,
    slug: course.slug,
    duration: totalMinutes > 0 ? `${Math.max(1, Math.round(totalMinutes / 60))} hours` : course.duration ?? "Self-paced",
    progress: Number(course.progress ?? 0),
    lessons: Number(lessonsCount ?? 0),
    instructor: course.instructorName ?? "MR Creativist Instructor"
  };
}

export async function issueCertificateCredential(user, body) {
  await connectMongoDB();
  const identity = userIdentity(user);
  const courseSlug = String(body?.courseSlug ?? "").trim();
  const courseTitle = String(body?.courseTitle ?? body?.title ?? "MR Creativist Course").trim();

  if (!courseSlug) throw new Error("Course slug is required.");

  const course = await Course.findOne({ slug: courseSlug }).select("_id title").lean();
  if (course?._id) {
    const [progress, enrollment] = await Promise.all([
      LearningProgress.findOne({ courseId: course._id, learnerEmail: identity.email }).select("progressPercent status").lean(),
      Enrollment.findOne({ courseId: course._id, learnerEmail: identity.email }).select("progressPercent status").lean()
    ]);
    const progressPercent = Math.max(Number(progress?.progressPercent ?? 0), Number(enrollment?.progressPercent ?? 0));
    const completed = progress?.status === "completed" || enrollment?.status === "completed" || progressPercent >= 100;

    if (!completed) {
      throw new Error("Complete this course before generating its certificate.");
    }
  }

  const certificate = await CertificateCredential.findOneAndUpdate(
    { userEmail: identity.email, courseSlug },
    {
      $setOnInsert: {
        userId: identity.id,
        userEmail: identity.email,
        learnerName: identity.name ?? identity.email,
        courseId: course?._id,
        courseSlug,
        courseTitle: course?.title ?? courseTitle,
        verificationCode: certificateCode(courseSlug),
        template: body?.template ?? "Professional",
        issuedAt: new Date(),
        metadata: { source: "dashboard" }
      }
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  ).lean();

  if (course?._id) {
    await Enrollment.findOneAndUpdate(
      { courseId: course._id, learnerEmail: identity.email },
      { certificateIssuedAt: new Date(), status: "completed", progressPercent: 100 },
      { returnDocument: "after" }
    );
  }

  return publicCertificate(certificate);
}
