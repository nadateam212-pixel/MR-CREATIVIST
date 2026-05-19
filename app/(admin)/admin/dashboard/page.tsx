import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Archive,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Database,
  FileCheck2,
  GraduationCap,
  Headphones,
  MessageSquare,
  Newspaper,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet
} from "lucide-react";
import { AdminOperationsConsole } from "@/components/admin/admin-operations-console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import connectMongoDB from "@/lib/mongodb";
import AccountApplication from "@/models/AccountApplication";
import AITool from "@/models/AITool";
import BlogPost from "@/models/BlogPost";
import Booking from "@/models/Booking";
import ConsultingService from "@/models/ConsultingService";
import ContactMessage from "@/models/ContactMessage";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import FreelancerProfile from "@/models/FreelancerProfile";
import JobPost from "@/models/JobPost";
import MultimediaProject from "@/models/MultimediaProject";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";
import UploadAsset from "@/models/UploadAsset";
import User from "@/models/User";

export const dynamic = "force-dynamic";

type QueueRow = {
  id: string;
  type: string;
  title: string;
  owner: string;
  status: string;
  updatedAt?: Date | string;
  href: string;
};

type ResourceRow = {
  label: string;
  total: number;
  active: number;
  review: number;
  href: string;
};

type MongoId = {
  _id: unknown;
};

type TimedRecord = MongoId & {
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type ApplicationQueueDoc = TimedRecord & {
  applicantEmail: string;
  requestedRole: string;
  status: string;
};

type CourseQueueDoc = TimedRecord & {
  title: string;
  instructorName: string;
  status: string;
  enrolledCount?: number;
  price?: number;
};

type ProductQueueDoc = TimedRecord & {
  name: string;
  sellerName: string;
  status: string;
  stock?: number;
  price?: number;
};

type BookingQueueDoc = TimedRecord & {
  clientEmail: string;
  sessionType: string;
  status: string;
};

type MessageQueueDoc = TimedRecord & {
  email: string;
  subject: string;
  status: string;
};

type UserDoc = TimedRecord & {
  name: string;
  email: string;
  role: string;
  accountStatus?: string;
};

type OrderDoc = TimedRecord & {
  buyerName: string;
  buyerEmail: string;
  total?: number;
  currency?: string;
  status: string;
};

function getSevenDaysAgo() {
  const value = new Date();
  value.setDate(value.getDate() - 7);
  return value;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function formatDate(value?: Date | string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["active", "published", "paid", "fulfilled", "approved", "completed", "confirmed"].includes(normalized)) {
    return "border-[hsl(var(--primary))]/35 text-[hsl(var(--primary))]";
  }
  if (["pending", "requested", "draft", "new", "review", "needs_more_info"].includes(normalized)) {
    return "border-amber-500/35 text-amber-500";
  }
  if (["suspended", "cancelled", "rejected", "refunded", "archived"].includes(normalized)) {
    return "border-[hsl(var(--destructive))]/35 text-[hsl(var(--destructive))]";
  }
  return "";
}

function toQueueRows({
  applications,
  courses,
  products,
  bookings,
  messages
}: {
  applications: ApplicationQueueDoc[];
  courses: CourseQueueDoc[];
  products: ProductQueueDoc[];
  bookings: BookingQueueDoc[];
  messages: MessageQueueDoc[];
}) {
  return [
    ...applications.map((item) => ({
      id: String(item._id),
      type: "Account",
      title: `${item.requestedRole} validation`,
      owner: item.applicantEmail,
      status: item.status,
      updatedAt: item.updatedAt,
      href: "/admin/account-applications"
    })),
    ...courses.map((item) => ({
      id: String(item._id),
      type: "Course",
      title: item.title,
      owner: item.instructorName,
      status: item.status,
      updatedAt: item.updatedAt,
      href: `/admin/courses/${item._id}`
    })),
    ...products.map((item) => ({
      id: String(item._id),
      type: "Product",
      title: item.name,
      owner: item.sellerName,
      status: item.status,
      updatedAt: item.updatedAt,
      href: "/admin/marketplace/products"
    })),
    ...bookings.map((item) => ({
      id: String(item._id),
      type: "Booking",
      title: item.sessionType,
      owner: item.clientEmail,
      status: item.status,
      updatedAt: item.updatedAt,
      href: "/admin/consulting/bookings"
    })),
    ...messages.map((item) => ({
      id: String(item._id),
      type: "Support",
      title: item.subject,
      owner: item.email,
      status: item.status,
      updatedAt: item.updatedAt,
      href: "/admin/support"
    }))
  ]
    .sort((left, right) => new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime())
    .slice(0, 10) satisfies QueueRow[];
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6">
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-6 text-[hsl(var(--primary))]" />
        <Badge className="uppercase">{label}</Badge>
      </div>
      <p className="mt-6 text-4xl font-black uppercase tracking-tight">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">{detail}</p>
    </div>
  );
}

function EmptyTable({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={5} className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        {message}
      </td>
    </tr>
  );
}

export default async function AdminDashboardPage() {
  await connectMongoDB();

  const sevenDaysAgo = getSevenDaysAgo();

  const [
    userCount,
    newUserCount,
    suspendedUserCount,
    courseCount,
    publishedCourseCount,
    draftCourseCount,
    productCount,
    publishedProductCount,
    draftProductCount,
    jobCount,
    publishedJobCount,
    draftJobCount,
    blogCount,
    publishedBlogCount,
    draftBlogCount,
    shopCount,
    publishedShopCount,
    draftShopCount,
    orderCount,
    paidOrderCount,
    enrollmentCount,
    bookingCount,
    requestedBookingCount,
    freelancerCount,
    freelancerUserCount,
    instructorUserCount,
    serviceCount,
    aiToolCount,
    projectCount,
    pendingApplicationCount,
    reviewApplicationCount,
    newMessageCount,
    uploadCount,
    orderRevenue,
    enrollmentRevenue,
    recentUsers,
    queueApplications,
    queueCourses,
    queueProducts,
    queueBookings,
    queueMessages,
    recentOrders,
    recentCourses,
    recentProducts
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ accountStatus: "suspended" }),
    Course.countDocuments({}),
    Course.countDocuments({ status: "published" }),
    Course.countDocuments({ status: "draft" }),
    Product.countDocuments({}),
    Product.countDocuments({ status: "published" }),
    Product.countDocuments({ status: "draft" }),
    JobPost.countDocuments({}),
    JobPost.countDocuments({ status: "published" }),
    JobPost.countDocuments({ status: "draft" }),
    BlogPost.countDocuments({ deletedAt: { $exists: false } }),
    BlogPost.countDocuments({ published: true, deletedAt: { $exists: false } }),
    BlogPost.countDocuments({ published: false, deletedAt: { $exists: false } }),
    ShopProfile.countDocuments({}),
    ShopProfile.countDocuments({ status: "published" }),
    ShopProfile.countDocuments({ status: "draft" }),
    Order.countDocuments({}),
    Order.countDocuments({ status: { $in: ["paid", "fulfilled"] } }),
    Enrollment.countDocuments({}),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: "requested" }),
    FreelancerProfile.countDocuments({}),
    User.countDocuments({ $or: [{ role: "freelancer" }, { validatedRoles: "freelancer" }] }),
    User.countDocuments({ $or: [{ role: "instructor" }, { validatedRoles: "instructor" }] }),
    ConsultingService.countDocuments({}),
    AITool.countDocuments({}),
    MultimediaProject.countDocuments({}),
    AccountApplication.countDocuments({ status: "pending" }),
    AccountApplication.countDocuments({ status: "needs_more_info" }),
    ContactMessage.countDocuments({ status: "new" }),
    UploadAsset.countDocuments({}),
    Order.aggregate([
      { $match: { status: { $in: ["paid", "fulfilled"] } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
    ]),
    Enrollment.aggregate([
      { $match: { status: { $in: ["active", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" }, count: { $sum: 1 } } }
    ]),
    User.find({}).select("name email role accountStatus validatedRoles createdAt").sort({ createdAt: -1 }).limit(8).lean(),
    AccountApplication.find({ status: { $in: ["pending", "needs_more_info"] } })
      .select("applicantEmail requestedRole status updatedAt")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    Course.find({ status: "draft" }).select("title instructorName status updatedAt").sort({ updatedAt: -1 }).limit(4).lean(),
    Product.find({ status: "draft" }).select("name sellerName status updatedAt").sort({ updatedAt: -1 }).limit(4).lean(),
    Booking.find({ status: "requested" }).select("clientEmail sessionType status updatedAt").sort({ updatedAt: -1 }).limit(4).lean(),
    ContactMessage.find({ status: "new" }).select("email subject status updatedAt").sort({ updatedAt: -1 }).limit(4).lean(),
    Order.find({}).select("buyerName buyerEmail total currency status paymentMethod createdAt").sort({ createdAt: -1 }).limit(8).lean(),
    Course.find({}).select("title instructorName status enrolledCount price updatedAt").sort({ updatedAt: -1 }).limit(6).lean(),
    Product.find({}).select("name sellerName status stock price updatedAt").sort({ updatedAt: -1 }).limit(6).lean()
  ]);

  const marketplaceRevenue = Number(orderRevenue[0]?.total ?? 0);
  const learningRevenue = Number(enrollmentRevenue[0]?.total ?? 0);
  const totalRevenue = marketplaceRevenue + learningRevenue;
  const totalFreelancerCount = Math.max(freelancerCount, freelancerUserCount);
  const approvalQueueCount = pendingApplicationCount + reviewApplicationCount + draftCourseCount + draftProductCount + draftJobCount + draftBlogCount + draftShopCount + requestedBookingCount + newMessageCount;
  const totalContentCount = courseCount + productCount + jobCount + blogCount + shopCount + serviceCount + totalFreelancerCount + instructorUserCount + aiToolCount + projectCount;
  const queueRows = toQueueRows({
    applications: queueApplications,
    courses: queueCourses,
    products: queueProducts,
    bookings: queueBookings,
    messages: queueMessages
  });

  const resources: ResourceRow[] = [
    { label: "Users", total: userCount, active: userCount - suspendedUserCount, review: suspendedUserCount, href: "/admin/users" },
    { label: "Courses", total: courseCount, active: publishedCourseCount, review: draftCourseCount, href: "/admin/courses" },
    { label: "Products", total: productCount, active: publishedProductCount, review: draftProductCount, href: "/admin/marketplace/products" },
    { label: "Jobs", total: jobCount, active: publishedJobCount, review: draftJobCount, href: "/admin/jobs" },
    { label: "Blogs", total: blogCount, active: publishedBlogCount, review: draftBlogCount, href: "/admin/blogs" },
    { label: "Businesses", total: shopCount, active: publishedShopCount, review: draftShopCount, href: "/admin/shops" },
    { label: "Orders", total: orderCount, active: paidOrderCount, review: orderCount - paidOrderCount, href: "/admin/marketplace/orders" },
    { label: "Consulting", total: serviceCount + bookingCount, active: serviceCount, review: requestedBookingCount, href: "/admin/consulting/bookings" },
    { label: "Freelancers", total: totalFreelancerCount, active: totalFreelancerCount, review: 0, href: "/admin/freelancers" },
    { label: "Instructors", total: instructorUserCount, active: instructorUserCount, review: 0, href: "/admin/instructors" },
    { label: "AI tools", total: aiToolCount, active: aiToolCount, review: 0, href: "/admin/developer-tools" },
    { label: "Uploads", total: uploadCount, active: uploadCount, review: 0, href: "/admin/compliance" }
  ];

  const tools = [
    { label: "Users", href: "/admin/users", icon: Users, count: userCount, body: "Roles, validation, status, and account controls." },
    { label: "Applications", href: "/admin/account-applications", icon: ShieldCheck, count: pendingApplicationCount + reviewApplicationCount, body: "Instructor, seller, freelancer, and consultant approvals." },
    { label: "Messages", href: "/admin/messages", icon: MessageSquare, count: newMessageCount, body: "Private replies, user conversations, contact follow-up, and support handoff." },
    { label: "Instructors", href: "/admin/instructors", icon: GraduationCap, count: instructorUserCount, body: "Instructor accounts, moderation state, course ownership, and messaging." },
    { label: "Freelancers", href: "/admin/freelancers", icon: BriefcaseBusiness, count: totalFreelancerCount, body: "Freelancer profiles, jobs, profile visibility, blocking, and contact controls." },
    { label: "Courses", href: "/admin/courses", icon: BookOpen, count: courseCount, body: "Curriculum quality, publishing, and instructor oversight." },
    { label: "Products", href: "/admin/marketplace/products", icon: ShoppingBag, count: productCount, body: "Marketplace catalog, inventory, and seller trust checks." },
    { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness, count: jobCount, body: "Public job posts, hiring details, applications, and featured placement." },
    { label: "Blogs", href: "/admin/blogs", icon: Newspaper, count: blogCount, body: "Public blogs, news, information, SEO content, and editorial publishing." },
    { label: "Businesses", href: "/admin/shops", icon: ShoppingBag, count: shopCount, body: "Seller business profiles, contacts, offers, locations, and service listings." },
    { label: "Orders", href: "/admin/marketplace/orders", icon: ReceiptText, count: orderCount, body: "Purchases, fulfillment, refunds, and dispute routing." },
    { label: "Consulting", href: "/admin/consulting/bookings", icon: CalendarClock, count: bookingCount, body: "Session requests, experts, availability, and outcomes." },
    { label: "Payments", href: "/admin/payments", icon: CreditCard, count: paidOrderCount, body: "Revenue, payouts, fees, and payment operation review." },
    { label: "Support", href: "/admin/support", icon: Headphones, count: newMessageCount, body: "New contact messages, tickets, and response workflow." },
    { label: "Reports", href: "/admin/reports", icon: BarChart3, count: totalContentCount, body: "Growth, content, revenue, and audit-ready exports." },
    { label: "Health", href: "/admin/health", icon: Activity, count: uploadCount, body: "Database, uploads, logs, webhooks, and uptime checks." },
    { label: "Backups", href: "/admin/backups", icon: Archive, count: 0, body: "Create snapshots and confirm restore readiness." },
    { label: "Settings", href: "/admin/settings", icon: Settings, count: 0, body: "Platform defaults, integrations, and security policy." }
  ];

  const exportPayload = {
    generatedAt: new Date().toISOString(),
    revenue: { totalRevenue, marketplaceRevenue, learningRevenue },
    counts: {
      userCount,
      newUserCount,
      suspendedUserCount,
      courseCount,
      productCount,
      jobCount,
      blogCount,
      shopCount,
      orderCount,
      enrollmentCount,
      bookingCount,
      freelancerCount: totalFreelancerCount,
      instructorUserCount,
      pendingApplicationCount,
      newMessageCount,
      uploadCount
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12">
      <section className="relative min-h-[28rem] overflow-hidden rounded-lg border border-[hsl(var(--border))]">
        <Image
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1800&q=85"
          alt="MR Creativist admin analytics and operations dashboard"
          fill
          sizes="(min-width: 1024px) 74vw, 100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/78" />
        <div className="relative grid min-h-[28rem] gap-8 p-6 text-white sm:p-8 lg:grid-cols-[1fr_22rem] lg:items-end lg:p-10">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] backdrop-blur">
              <ShieldCheck className="size-4 text-cyan-300" />
              ADMIN COMMAND CENTER
            </div>
            <h1 className="text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl">
              Control the platform with live operational data.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              Manage users, approvals, courses, products, orders, support, finance, uploads, and system actions from a
              dashboard that reflects live platform records.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/admin/account-applications">
                  REVIEW QUEUE
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white bg-white/10 text-white hover:bg-white/20">
                <Link href="/admin/users">
                  <Users className="size-5" />
                  MANAGE USERS
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
            {[
              `${formatCompact(approvalQueueCount)} ITEMS NEED ACTION`,
              `${formatMoney(totalRevenue)} TRACKED REVENUE`,
              `${formatCompact(userCount)} USER ACCOUNTS`,
              `${formatCompact(totalContentCount)} PLATFORM RECORDS`
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-black uppercase text-slate-100">
                <CheckCircle2 className="size-4 text-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/45 p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Revenue" value={formatMoney(totalRevenue)} detail={`${formatMoney(marketplaceRevenue)} commerce, ${formatMoney(learningRevenue)} learning`} icon={Wallet} />
          <MetricCard label="Users" value={formatCompact(userCount)} detail={`${newUserCount} new this week, ${suspendedUserCount} suspended`} icon={Users} />
          <MetricCard label="Queue" value={formatCompact(approvalQueueCount)} detail={`${pendingApplicationCount + reviewApplicationCount} role reviews, ${draftCourseCount + draftProductCount + draftBlogCount} content drafts`} icon={FileCheck2} />
          <MetricCard label="Records" value={formatCompact(totalContentCount)} detail={`${courseCount} courses, ${productCount} products, ${blogCount} blogs`} icon={Database} />
        </div>
      </section>

      <section>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">ADMIN TOOLKIT</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Manage every platform system</h2>
            <p className="mt-4 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
              Each card opens a real admin workspace with live records, approval state, and platform controls.
            </p>
          </div>
          <div className="w-full lg:max-w-md">
            <AdminOperationsConsole exportPayload={exportPayload} />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <Card className="h-full transition-colors hover:bg-[hsl(var(--muted))]/35">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <tool.icon className="size-7 text-[hsl(var(--primary))]" />
                    {tool.count > 0 ? <Badge>{formatCompact(tool.count)}</Badge> : null}
                  </div>
                  <CardTitle className="uppercase">{tool.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{tool.body}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">LIVE QUEUES</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Review what needs action</h2>
          <p className="mt-4 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            Tables stay compact, scannable, and connected to the exact admin workspaces that handle each item.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="uppercase">Approval command queue</CardTitle>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Accounts, content, bookings, and support items waiting for action.</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/account-applications">Open review console</Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Item</th>
                  <th className="p-4 font-medium">Owner</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {queueRows.length ? (
                  queueRows.map((item) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td className="p-4">
                        <Badge>{item.type}</Badge>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatDate(item.updatedAt)}</p>
                      </td>
                      <td className="p-4 text-[hsl(var(--muted-foreground))]">{item.owner}</td>
                      <td className="p-4">
                        <Badge className={statusTone(item.status)}>{item.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={item.href}>Manage</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTable message="No approvals are waiting right now." />
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="uppercase">Resource control table</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {resources.map((resource) => (
              <Link
                key={resource.label}
                href={resource.href}
                className="grid gap-3 rounded-md border border-[hsl(var(--border))] p-4 transition-colors hover:bg-[hsl(var(--muted))]/40 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold">{resource.label}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {formatCompact(resource.active)} active, {formatCompact(resource.review)} needs review
                  </p>
                </div>
                <Badge>{formatCompact(resource.total)}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">ACTIVITY TABLES</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Track accounts and revenue</h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="uppercase">Recent users</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {recentUsers.length ? (
                  (recentUsers as UserDoc[]).map((user) => (
                    <tr key={String(user._id)}>
                      <td className="p-4">
                        <p className="font-medium">{user.name}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <Badge>{user.role}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={statusTone(user.accountStatus ?? "active")}>{user.accountStatus ?? "active"}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/users">Manage</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTable message="No users have been created yet." />
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="uppercase">Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-y border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="p-4 font-medium">Buyer</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {recentOrders.length ? (
                  (recentOrders as OrderDoc[]).map((order) => (
                    <tr key={String(order._id)}>
                      <td className="p-4">
                        <p className="font-medium">{order.buyerName}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{order.buyerEmail}</p>
                      </td>
                      <td className="p-4 font-medium">{formatMoney(Number(order.total ?? 0))}</td>
                      <td className="p-4">
                        <Badge className={statusTone(order.status)}>{order.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/marketplace/orders">Manage</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTable message="No orders have been placed yet." />
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="uppercase">Course publishing</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/courses">Manage courses</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentCourses.length ? (
              (recentCourses as CourseQueueDoc[]).map((course) => (
                <div key={String(course._id)} className="flex flex-col gap-3 rounded-md border border-[hsl(var(--border))] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      {course.instructorName} - {formatCompact(Number(course.enrolledCount ?? 0))} learners
                    </p>
                  </div>
                  <Badge className={statusTone(course.status)}>{course.status}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No courses are published yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="uppercase">Marketplace inventory</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/marketplace/products">Manage products</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentProducts.length ? (
              (recentProducts as ProductQueueDoc[]).map((product) => (
                <div key={String(product._id)} className="flex flex-col gap-3 rounded-md border border-[hsl(var(--border))] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      {product.sellerName} - {Number(product.stock ?? 0)} in stock
                    </p>
                  </div>
                  <Badge className={statusTone(product.status)}>{product.status}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No products are published yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Compliance", href: "/admin/compliance", icon: BadgeCheck, body: `${uploadCount} uploaded assets available for review.` },
          { label: "Moderation", href: "/admin/moderation", icon: ShieldCheck, body: `${newMessageCount} new support or contact items need triage.` },
          { label: "Finance", href: "/admin/payments", icon: CreditCard, body: `${formatMoney(totalRevenue)} tracked across orders and enrollments.` }
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <item.icon className="mb-4 size-5 text-[hsl(var(--primary))]" />
              <p className="font-semibold">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p>
              <Button asChild className="mt-4 w-full" variant="outline">
                <Link href={item.href}>Open {item.label.toLowerCase()}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
