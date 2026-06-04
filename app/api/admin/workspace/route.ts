import mongoose from "mongoose";
import { auth } from "@/auth";
import connectMongoDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import CertificateCredential from "@/models/CertificateCredential";
import ContactMessage from "@/models/ContactMessage";
import ConsultingService from "@/models/ConsultingService";
import Course from "@/models/Course";
import Gig from "@/models/Gig";
import Message from "@/models/Message";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import Notification from "@/models/Notification";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ReferralProfile from "@/models/ReferralProfile";
import ShopProfile from "@/models/ShopProfile";
import UploadAsset from "@/models/UploadAsset";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import WorkspaceRecord from "@/models/WorkspaceRecord";

type AdminMetric = {
  label: string;
  value: string;
  helper?: string;
};

type AdminRow = {
  id: string;
  resource: string;
  title: string;
  subtitle: string;
  kind: string;
  status: string;
  amount?: number;
  currency?: string;
  updatedAt?: string;
  details: Record<string, string>;
  actions: string[];
};

type AnyDoc = Record<string, unknown>;

const moderationStatuses = ["draft", "submitted", "changes_requested", "approved"];

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value ?? 0));
}

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "FRW" ? 0 : 2
  }).format(Number(value ?? 0));
}

function idOf(item: AnyDoc) {
  return String(item._id ?? item.id ?? "");
}

function shortId(item: AnyDoc) {
  return idOf(item).slice(-7).toUpperCase() || "RECORD";
}

function isoDate(value: unknown) {
  if (!value) return new Date().toISOString();
  return new Date(String(value)).toISOString();
}

function dateOf(item: AnyDoc) {
  return isoDate(item.updatedAt ?? item.createdAt ?? Date.now());
}

function text(value: unknown, fallback = "Not recorded") {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || fallback;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function row(item: AnyDoc, input: Omit<AdminRow, "id" | "updatedAt"> & { id?: string; updatedAt?: string }): AdminRow {
  return {
    id: input.id ?? idOf(item),
    updatedAt: input.updatedAt ?? dateOf(item),
    ...input
  };
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }
  return null;
}

async function getCounts() {
  const [
    users,
    courses,
    products,
    gigs,
    shops,
    orders,
    bookings,
    certificates,
    payments,
    openMessages
  ] = await Promise.all([
    User.countDocuments({}),
    Course.countDocuments({}),
    Product.countDocuments({}),
    Gig.countDocuments({}),
    ShopProfile.countDocuments({}),
    Order.countDocuments({}),
    Booking.countDocuments({}),
    CertificateCredential.countDocuments({}),
    WalletTransaction.countDocuments({}),
    ContactMessage.countDocuments({ status: { $in: ["new", "read"] } })
  ]);

  return { users, courses, products, gigs, shops, orders, bookings, certificates, payments, openMessages };
}

function titleForPath(pathname: string, fallback: string) {
  if (pathname.includes("/marketplace/orders")) return "Marketplace orders";
  if (pathname.includes("/consulting/bookings")) return "Consulting bookings";
  if (pathname.includes("/payments")) return "Payments";
  if (pathname.includes("/reports")) return "Reports";
  if (pathname.includes("/support")) return "Support system";
  if (pathname.includes("/health")) return "System health";
  if (pathname.includes("/backups")) return "Backup and restore";
  if (pathname.includes("/notifications")) return "Notifications";
  if (pathname.includes("/moderation")) return "Moderation queue";
  if (pathname.includes("/email-campaigns")) return "Email campaigns";
  if (pathname.includes("/affiliate")) return "Affiliate management";
  if (pathname.includes("/developer-tools")) return "Developer tools";
  if (pathname.includes("/compliance")) return "Compliance";
  if (pathname.includes("/settings")) return "Platform settings";
  return fallback;
}

async function orderWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const [orders, paidCount, refundCount] = await Promise.all([
    Order.find({}).sort({ updatedAt: -1 }).limit(120).lean(),
    Order.countDocuments({ status: { $in: ["paid", "fulfilled"] } }),
    Order.countDocuments({ status: "refunded" })
  ]);
  const revenue = orders
    .filter((order) => ["paid", "fulfilled"].includes(String(order.status)))
    .reduce((total, order) => total + Number(order.total ?? 0), 0);

  return {
    metrics: [
      { label: "Orders", value: String(orders.length), helper: "Latest records loaded" },
      { label: "Paid/Fulfilled", value: String(paidCount), helper: "Revenue-ready orders" },
      { label: "Refunds", value: String(refundCount), helper: "Refunded orders" },
      { label: "Loaded revenue", value: money(revenue, "USD"), helper: "Current result window" }
    ],
    rows: orders.map((orderDoc) =>
      row(orderDoc, {
        resource: "order",
        title: `Order ${shortId(orderDoc)}`,
        subtitle: `${text(orderDoc.buyerName)} - ${text(orderDoc.buyerEmail)}`,
        kind: text(orderDoc.paymentMethod, "payment"),
        status: text(orderDoc.status, "pending"),
        amount: Number(orderDoc.total ?? 0),
        currency: text(orderDoc.currency, "USD"),
        details: {
          buyer: `${text(orderDoc.buyerName)} (${text(orderDoc.buyerEmail)})`,
          items: Array.isArray(orderDoc.items) ? `${orderDoc.items.length} item(s)` : "0 items",
          subtotal: money(Number(orderDoc.subtotal ?? 0), text(orderDoc.currency, "USD")),
          tax: money(Number(orderDoc.tax ?? 0), text(orderDoc.currency, "USD")),
          discount: money(Number(orderDoc.discount ?? 0), text(orderDoc.currency, "USD")),
          total: money(Number(orderDoc.total ?? 0), text(orderDoc.currency, "USD"))
        },
        actions: ["Mark paid", "Fulfill", "Refund", "Cancel", "Delete"]
      })
    )
  };
}

async function bookingWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const [bookings, requested, upcoming] = await Promise.all([
    Booking.find({}).populate("serviceId", "title expertName hourlyRate currency").sort({ scheduledFor: -1 }).limit(120).lean(),
    Booking.countDocuments({ status: "requested" }),
    Booking.countDocuments({ scheduledFor: { $gte: new Date() }, status: { $in: ["requested", "confirmed"] } })
  ]);

  return {
    metrics: [
      { label: "Bookings", value: String(bookings.length), helper: "Latest requests" },
      { label: "Requested", value: String(requested), helper: "Waiting for confirmation" },
      { label: "Upcoming", value: String(upcoming), helper: "Future requested or confirmed" },
      { label: "Completed", value: String(await Booking.countDocuments({ status: "completed" })), helper: "Closed sessions" }
    ],
    rows: bookings.map((bookingDoc) => {
      const service = (bookingDoc.serviceId ?? {}) as AnyDoc;

      return row(bookingDoc, {
        resource: "booking",
        title: `${text(bookingDoc.clientName)} booking`,
        subtitle: `${text(service.title, text(bookingDoc.sessionType))} - ${text(bookingDoc.clientEmail)}`,
        kind: text(bookingDoc.sessionType, "session"),
        status: text(bookingDoc.status, "requested"),
        details: {
          client: `${text(bookingDoc.clientName)} (${text(bookingDoc.clientEmail)})`,
          service: text(service.title, "Consulting service"),
          expert: text(service.expertName, "Not assigned"),
          scheduledFor: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(bookingDoc.scheduledFor))),
          notes: text(bookingDoc.notes, "No notes")
        },
        actions: ["Confirm", "Complete", "Cancel", "Delete"]
      });
    })
  };
}

async function paymentsWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const transactions = await WalletTransaction.find({}).sort({ updatedAt: -1 }).limit(160).lean();
  const completed = transactions.filter((item) => item.status === "completed");
  const pending = await WalletTransaction.countDocuments({ status: "pending" });
  const credits = completed.filter((item) => item.direction === "credit").reduce((total, item) => total + Number(item.amount ?? 0), 0);
  const debits = completed.filter((item) => item.direction === "debit").reduce((total, item) => total + Number(item.amount ?? 0), 0);

  return {
    metrics: [
      { label: "Transactions", value: String(transactions.length), helper: "Latest ledger rows" },
      { label: "Pending", value: String(pending), helper: "Needs settlement" },
      { label: "Credits", value: money(credits, "USD"), helper: "Completed credit window" },
      { label: "Debits", value: money(debits, "USD"), helper: "Completed debit window" }
    ],
    rows: transactions.map((transaction) =>
      row(transaction, {
        resource: "payment",
        title: text(transaction.description, `${text(transaction.type)} transaction`),
        subtitle: `${text(transaction.userEmail)} - ${text(transaction.referenceType, "manual")}`,
        kind: text(transaction.type, "transaction"),
        status: text(transaction.status, "pending"),
        amount: Number(transaction.amount ?? 0),
        currency: text(transaction.currency, "USD"),
        details: {
          user: text(transaction.userEmail),
          counterparty: text(transaction.counterpartyEmail),
          direction: text(transaction.direction),
          reference: `${text(transaction.referenceType)} / ${text(transaction.referenceId)}`,
          balanceAfter: money(Number(transaction.balanceAfter ?? 0), text(transaction.currency, "USD"))
        },
        actions: ["Complete", "Cancel", "Fail", "Delete"]
      })
    )
  };
}

async function supportWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const [contacts, supportMessages] = await Promise.all([
    ContactMessage.find({}).sort({ updatedAt: -1 }).limit(90).lean(),
    Message.find({ contextType: "support" }).sort({ updatedAt: -1 }).limit(90).lean()
  ]);
  const rows = [
    ...contacts.map((message) =>
      row(message, {
        resource: "contactMessage",
        title: text(message.subject, "Support request"),
        subtitle: `${text(message.name)} - ${text(message.email)}`,
        kind: text(message.source, "contact"),
        status: text(message.status, "new"),
        details: {
          name: text(message.name),
          email: text(message.email),
          subject: text(message.subject),
          message: text(message.message),
          source: text(message.source)
        },
        actions: ["Mark read", "Mark replied", "Archive", "Delete"]
      })
    ),
    ...supportMessages.map((message) =>
      row(message, {
        resource: "message",
        title: text(message.subject, "Support conversation"),
        subtitle: text(message.content).slice(0, 120),
        kind: "support message",
        status: message.readAt ? "read" : "unread",
        details: {
          conversation: text(message.conversationKey),
          contextId: text(message.contextId),
          content: text(message.content),
          attachments: Array.isArray(message.attachments) ? `${message.attachments.length} attachment(s)` : "0 attachments"
        },
        actions: ["Mark read", "Mark unread", "Delete"]
      })
    )
  ];

  return {
    metrics: [
      { label: "Contact tickets", value: String(contacts.length), helper: "Contact form records" },
      { label: "Support messages", value: String(supportMessages.length), helper: "In-app support context" },
      { label: "New contacts", value: String(contacts.filter((item) => item.status === "new").length), helper: "Needs attention" },
      { label: "Unread messages", value: String(supportMessages.filter((item) => !item.readAt).length), helper: "Needs staff reply" }
    ],
    rows
  };
}

async function moderationWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const [courses, products, gigs, shops, services] = await Promise.all([
    Course.find({ status: { $in: moderationStatuses } }).sort({ updatedAt: -1 }).limit(40).lean(),
    Product.find({ status: { $in: moderationStatuses } }).sort({ updatedAt: -1 }).limit(40).lean(),
    Gig.find({ status: { $in: moderationStatuses } }).sort({ updatedAt: -1 }).limit(40).lean(),
    ShopProfile.find({ status: { $in: moderationStatuses } }).sort({ updatedAt: -1 }).limit(40).lean(),
    ConsultingService.find({ status: { $in: moderationStatuses } }).sort({ updatedAt: -1 }).limit(40).lean()
  ]);
  const actions = ["Approve", "Publish", "Request changes", "Archive", "Delete"];
  const rows = [
    ...courses.map((item) =>
      row(item, {
        resource: "course",
        title: text(item.title),
        subtitle: `${text(item.category)} - ${text(item.instructorName)}`,
        kind: "course",
        status: text(item.status, "draft"),
        details: { instructor: text(item.instructorName), learners: text(item.enrolledCount, "0"), price: money(Number(item.price ?? 0), text(item.currency, "USD")) },
        actions
      })
    ),
    ...products.map((item) =>
      row(item, {
        resource: "product",
        title: text(item.name),
        subtitle: `${text(item.category)} - ${text(item.sellerName)}`,
        kind: text(item.type, "product"),
        status: text(item.status, "draft"),
        details: { seller: text(item.sellerName), stock: text(item.stock, "0"), price: money(Number(item.price ?? 0), text(item.currency, "USD")) },
        actions
      })
    ),
    ...gigs.map((item) =>
      row(item, {
        resource: "gig",
        title: text(item.title),
        subtitle: `${text(item.ownerName)} - ${text(item.category)}`,
        kind: "gig",
        status: text(item.status, "draft"),
        details: { owner: text(item.ownerName), package: text(item.packageName), price: money(Number(item.price ?? 0), text(item.currency, "USD")) },
        actions
      })
    ),
    ...shops.map((item) =>
      row(item, {
        resource: "shop",
        title: text(item.name),
        subtitle: `${text(item.category)} - ${[item.city, item.country].filter(Boolean).join(", ") || "No location"}`,
        kind: "business",
        status: text(item.status, "draft"),
        details: { owner: text(item.ownerName), contact: text(item.contactEmail), category: text(item.category) },
        actions
      })
    ),
    ...services.map((item) =>
      row(item, {
        resource: "consulting",
        title: text(item.title),
        subtitle: `${text(item.expertName)} - ${text(item.expertTitle)}`,
        kind: "consulting",
        status: text(item.status, "draft"),
        details: { expert: text(item.expertName), rate: money(Number(item.hourlyRate ?? 0), text(item.currency, "USD")), expertise: text(item.expertise) },
        actions
      })
    )
  ];

  return {
    metrics: [
      { label: "Review rows", value: String(rows.length), helper: "Courses, products, gigs, businesses, consulting" },
      { label: "Submitted", value: String(rows.filter((item) => item.status === "submitted").length), helper: "Needs approval" },
      { label: "Changes requested", value: String(rows.filter((item) => item.status === "changes_requested").length), helper: "Waiting creator edits" },
      { label: "Approved", value: String(rows.filter((item) => item.status === "approved").length), helper: "Ready to publish" }
    ],
    rows
  };
}

async function certificatesSummary(): Promise<AdminMetric[]> {
  const [issued, revoked, learners, courses] = await Promise.all([
    CertificateCredential.countDocuments({ status: "issued" }),
    CertificateCredential.countDocuments({ status: "revoked" }),
    CertificateCredential.distinct("userEmail"),
    CertificateCredential.distinct("courseSlug")
  ]);

  return [
    { label: "Certificates", value: String(issued), helper: "Issued credentials" },
    { label: "Revoked", value: String(revoked), helper: "Revoked credentials" },
    { label: "Learners", value: String(learners.length), helper: "Unique certificate holders" },
    { label: "Courses", value: String(courses.length), helper: "Courses with credentials" }
  ];
}

async function reportingWorkspace(kind: string): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const counts = await getCounts();
  const certificateMetrics = await certificatesSummary();
  const latestRecords = await WorkspaceRecord.find({}).sort({ updatedAt: -1 }).limit(80).lean();
  const rows = latestRecords.map((recordDoc) =>
    row(recordDoc, {
      resource: "workspaceRecord",
      title: text(recordDoc.title, "Workspace record"),
      subtitle: `${text(recordDoc.userEmail)} - ${text(recordDoc.pathname)}`,
      kind: text(recordDoc.kind, "workspace"),
      status: text(recordDoc.status, "active"),
      amount: Number(recordDoc.amount ?? 0),
      currency: text(recordDoc.currency, "USD"),
      details: {
        user: text(recordDoc.userEmail),
        role: text(recordDoc.role),
        module: text(recordDoc.module),
        pathname: text(recordDoc.pathname),
        tags: text(recordDoc.tags)
      },
      actions: ["Archive", "Delete"]
    })
  );

  const metrics: AdminMetric[] =
    kind === "health"
      ? [
          { label: "Database", value: mongoose.connection.readyState === 1 ? "Online" : "Checking", helper: "MongoDB connection state" },
          { label: "Users", value: compact(counts.users), helper: "Registered accounts" },
          { label: "Content", value: compact(counts.courses + counts.products + counts.gigs + counts.shops), helper: "Course, product, gig, business records" },
          { label: "Open support", value: compact(counts.openMessages), helper: "Contact messages requiring attention" }
        ]
      : kind === "settings"
        ? [
            { label: "Users", value: compact(counts.users), helper: "Accounts controlled by admin" },
            { label: "Studio content", value: compact(counts.courses + counts.products + counts.gigs + counts.shops), helper: "Creator records" },
            { label: "Transactions", value: compact(counts.payments), helper: "Wallet ledger records" },
            { label: "Certificates", value: certificateMetrics[0].value, helper: "Issued credentials" }
          ]
        : [
            { label: "Users", value: compact(counts.users), helper: "Accounts" },
            { label: "Orders", value: compact(counts.orders), helper: "Marketplace order records" },
            { label: "Bookings", value: compact(counts.bookings), helper: "Consulting bookings" },
            { label: "Certificates", value: certificateMetrics[0].value, helper: "Issued credentials" }
          ];

  return { metrics, rows };
}

async function notificationsWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const notifications = await Notification.find({}).sort({ updatedAt: -1 }).limit(120).lean();

  return {
    metrics: [
      { label: "Notifications", value: String(notifications.length), helper: "Latest notifications" },
      { label: "Unread", value: String(notifications.filter((item) => !item.readAt).length), helper: "Not opened by users" },
      { label: "System", value: String(notifications.filter((item) => item.type === "system").length), helper: "System notices" },
      { label: "Messages", value: String(notifications.filter((item) => item.type === "message").length), helper: "Message notifications" }
    ],
    rows: notifications.map((item) =>
      row(item, {
        resource: "notification",
        title: text(item.title, "Notification"),
        subtitle: text(item.body).slice(0, 120),
        kind: text(item.type, "system"),
        status: item.readAt ? "read" : "unread",
        details: {
          title: text(item.title),
          body: text(item.body),
          type: text(item.type),
          userId: text(item.userId)
        },
        actions: ["Mark read", "Mark unread", "Delete"]
      })
    )
  };
}

async function emailWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const subscribers = await NewsletterSubscriber.find({}).sort({ updatedAt: -1 }).limit(120).lean();

  return {
    metrics: [
      { label: "Subscribers", value: String(subscribers.length), helper: "Newsletter records" },
      { label: "Active", value: String(subscribers.filter((item) => item.status === "active").length), helper: "Can receive campaigns" },
      { label: "Unsubscribed", value: String(subscribers.filter((item) => item.status === "unsubscribed").length), helper: "Suppressed audience" },
      { label: "Segments", value: String(new Set(subscribers.flatMap((item) => item.interests ?? [])).size), helper: "Unique interests" }
    ],
    rows: subscribers.map((item) =>
      row(item, {
        resource: "newsletter",
        title: text(item.name, text(item.email)),
        subtitle: text(item.email),
        kind: text(item.source, "newsletter"),
        status: text(item.status, "active"),
        details: {
          email: text(item.email),
          name: text(item.name),
          interests: text(item.interests),
          source: text(item.source)
        },
        actions: ["Reactivate", "Unsubscribe", "Delete"]
      })
    )
  };
}

async function affiliateWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const profiles = await ReferralProfile.find({}).sort({ revenue: -1, updatedAt: -1 }).limit(120).lean();
  const revenue = profiles.reduce((total, item) => total + Number(item.revenue ?? 0), 0);
  const unpaid = profiles.reduce((total, item) => total + Number(item.unpaidCommission ?? 0), 0);

  return {
    metrics: [
      { label: "Affiliates", value: String(profiles.length), helper: "Referral profiles" },
      { label: "Clicks", value: compact(profiles.reduce((total, item) => total + Number(item.clicks ?? 0), 0)), helper: "Tracked referral clicks" },
      { label: "Revenue", value: money(revenue, "USD"), helper: "Referral revenue" },
      { label: "Unpaid", value: money(unpaid, "USD"), helper: "Commission liability" }
    ],
    rows: profiles.map((item) =>
      row(item, {
        resource: "affiliate",
        title: text(item.code, "Affiliate code"),
        subtitle: text(item.userEmail),
        kind: "affiliate",
        status: text(item.status, "active"),
        amount: Number(item.unpaidCommission ?? 0),
        currency: "USD",
        details: {
          user: text(item.userEmail),
          code: text(item.code),
          clicks: text(item.clicks, "0"),
          conversions: text(item.conversions, "0"),
          rate: `${Math.round(Number(item.commissionRate ?? 0) * 100)}%`,
          revenue: money(Number(item.revenue ?? 0), "USD")
        },
        actions: ["Activate", "Suspend", "Review", "Delete"]
      })
    )
  };
}

async function developerWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const assets = await UploadAsset.find({}).sort({ updatedAt: -1 }).limit(120).lean();
  const totalBytes = assets.reduce((total, item) => total + Number(item.sizeBytes ?? 0), 0);

  return {
    metrics: [
      { label: "Assets", value: String(assets.length), helper: "Upload records" },
      { label: "Ready", value: String(assets.filter((item) => item.status === "ready").length), helper: "Usable files" },
      { label: "Failed", value: String(assets.filter((item) => item.status === "failed").length), helper: "Needs cleanup" },
      { label: "Storage", value: `${Math.round(totalBytes / 1024 / 1024)} MB`, helper: "Current result window" }
    ],
    rows: assets.map((item) =>
      row(item, {
        resource: "upload",
        title: text(item.fileName, "Upload asset"),
        subtitle: `${text(item.kind)} - ${text(item.provider)}`,
        kind: text(item.ownerType, "general"),
        status: text(item.status, "ready"),
        details: {
          fileName: text(item.fileName),
          mimeType: text(item.mimeType),
          provider: text(item.provider),
          ownerType: text(item.ownerType),
          size: `${Math.round(Number(item.sizeBytes ?? 0) / 1024)} KB`,
          url: text(item.url)
        },
        actions: ["Mark ready", "Mark failed", "Delete"]
      })
    )
  };
}

async function complianceWorkspace(): Promise<{ metrics: AdminMetric[]; rows: AdminRow[] }> {
  const users = await User.find({}).select("name email role accountStatus isVerified updatedAt createdAt").sort({ updatedAt: -1 }).limit(120).lean();
  const suspended = users.filter((item) => item.accountStatus === "suspended").length;

  return {
    metrics: [
      { label: "Users", value: String(users.length), helper: "Latest account records" },
      { label: "Suspended", value: String(suspended), helper: "Blocked accounts" },
      { label: "Review", value: String(users.filter((item) => item.accountStatus === "review").length), helper: "Compliance review" },
      { label: "Verified", value: String(users.filter((item) => item.isVerified).length), helper: "Verified account badges" }
    ],
    rows: users.map((item) =>
      row(item, {
        resource: "user",
        title: text(item.name, "User"),
        subtitle: text(item.email),
        kind: text(item.role, "client"),
        status: text(item.accountStatus, "active"),
        details: {
          email: text(item.email),
          role: text(item.role),
          verified: item.isVerified ? "yes" : "no",
          created: isoDate(item.createdAt)
        },
        actions: ["Activate", "Block", "Review", "Delete"]
      })
    )
  };
}

async function buildWorkspace(pathname: string, fallbackTitle: string) {
  if (pathname.includes("/marketplace/orders")) return orderWorkspace();
  if (pathname.includes("/consulting/bookings")) return bookingWorkspace();
  if (pathname.includes("/payments")) return paymentsWorkspace();
  if (pathname.includes("/support")) return supportWorkspace();
  if (pathname.includes("/notifications")) return notificationsWorkspace();
  if (pathname.includes("/moderation")) return moderationWorkspace();
  if (pathname.includes("/email-campaigns")) return emailWorkspace();
  if (pathname.includes("/affiliate")) return affiliateWorkspace();
  if (pathname.includes("/developer-tools")) return developerWorkspace();
  if (pathname.includes("/compliance")) return complianceWorkspace();
  if (pathname.includes("/health")) return reportingWorkspace("health");
  if (pathname.includes("/settings")) return reportingWorkspace("settings");
  if (pathname.includes("/reports")) return reportingWorkspace("reports");
  if (pathname.includes("/backups")) return reportingWorkspace("backups");
  return {
    ...(await reportingWorkspace("reports")),
    title: fallbackTitle
  };
}

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("pathname") ?? "/admin/dashboard";
    const title = titleForPath(pathname, searchParams.get("title") ?? "Admin workspace");
    const description = searchParams.get("description") ?? "Live administrative data, status controls, and audit-ready records.";
    const workspace = await buildWorkspace(pathname, title);

    return Response.json({
      title,
      description,
      metrics: workspace.metrics,
      rows: clean(workspace.rows),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Admin workspace unavailable." }, { status: 500 });
  }
}

function actionStatus(action: string, resource: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("publish")) return "published";
  if (normalized.includes("approve")) return "approved";
  if (normalized.includes("request changes")) return "changes_requested";
  if (normalized.includes("archive")) return "archived";
  if (normalized.includes("unarchive")) return "published";
  if (normalized.includes("paid")) return "paid";
  if (normalized.includes("fulfill")) return "fulfilled";
  if (normalized.includes("refund")) return "refunded";
  if (normalized.includes("confirm")) return "confirmed";
  if (normalized.includes("complete")) return resource === "payment" ? "completed" : "completed";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("fail")) return "failed";
  if (normalized.includes("replied")) return "replied";
  if (normalized.includes("read")) return "read";
  if (normalized.includes("activate") || normalized.includes("reactivate") || normalized.includes("ready")) return resource === "newsletter" ? "active" : resource === "upload" ? "ready" : "active";
  if (normalized.includes("suspend") || normalized.includes("block")) return "suspended";
  if (normalized.includes("review")) return "review";
  if (normalized.includes("unsubscribe")) return "unsubscribed";
  return null;
}

function modelForResource(resource: string) {
  return {
    order: Order,
    booking: Booking,
    payment: WalletTransaction,
    contactMessage: ContactMessage,
    message: Message,
    notification: Notification,
    course: Course,
    product: Product,
    gig: Gig,
    shop: ShopProfile,
    consulting: ConsultingService,
    workspaceRecord: WorkspaceRecord,
    newsletter: NewsletterSubscriber,
    affiliate: ReferralProfile,
    upload: UploadAsset,
    user: User
  }[resource];
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await connectMongoDB();
    const body = (await request.json()) as { resource?: string; id?: string; action?: string };
    const resource = String(body.resource ?? "");
    const id = String(body.id ?? "");
    const action = String(body.action ?? "");
    const Model = modelForResource(resource);

    if (!Model || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Unsupported admin resource." }, { status: 422 });
    }

    if (action.toLowerCase() === "delete") {
      await Model.findByIdAndDelete(id);
      return Response.json({ ok: true, deleted: true, action, id });
    }

    const status = actionStatus(action, resource);
    const patch: Record<string, unknown> = {};

    if (resource === "notification" || resource === "message") {
      if (action.toLowerCase().includes("unread")) {
        await Model.findByIdAndUpdate(id, { $unset: { readAt: "" } }, { returnDocument: "after" });
        return Response.json({ ok: true, action, id, status: "unread" });
      }
      if (action.toLowerCase().includes("read")) patch.readAt = new Date();
    } else if (resource === "user") {
      if (status) patch.accountStatus = status === "suspended" ? "suspended" : status === "review" ? "review" : "active";
    } else if (resource === "upload") {
      if (status) patch.status = status === "failed" ? "failed" : "ready";
    } else if (status) {
      patch.status = status;
    }

    if (!Object.keys(patch).length) {
      return Response.json({ error: "No supported action was provided." }, { status: 422 });
    }

    await Model.findByIdAndUpdate(id, patch, { returnDocument: "after", runValidators: true });

    return Response.json({
      ok: true,
      id,
      action,
      status: resource === "notification" || resource === "message" ? "read" : String(patch.status ?? patch.accountStatus ?? status)
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Admin action failed." }, { status: 500 });
  }
}
