import connectMongoDB from "@/lib/mongodb";
import { AdminDashboardOverview, type AdminDashboardData } from "@/components/admin/admin-dashboard-overview";
import ContactMessage from "@/models/ContactMessage";
import Course from "@/models/Course";
import FreelancerProfile from "@/models/FreelancerProfile";
import JobPost from "@/models/JobPost";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export const dynamic = "force-dynamic";

const revenueTypes = [
  "deposit",
  "course_earning",
  "product_earning",
  "consulting_earning",
  "freelance_earning",
  "referral_earning",
  "admin_adjustment"
];

function monthWindows(count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - index - 1), 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      start: date
    };
  });
}

function dateValue(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await connectMongoDB();
  const months = monthWindows();
  const chartStart = months[0].start;

  const [
    totalUsers,
    activeUsers,
    premiumMembers,
    totalCourses,
    totalFreelancers,
    totalProducts,
    totalOrders,
    totalBusinesses,
    openSupport,
    pendingCourses,
    pendingFreelancers,
    pendingProducts,
    pendingBusinesses,
    pendingJobs,
    completedRevenue,
    revenueTrendRows,
    userGrowthRows,
    newestUsers,
    newestCourses,
    newestFreelancers,
    newestProducts,
    newestTransactions,
    topCourses
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ accountStatus: "active" }),
    User.countDocuments({ $or: [{ role: "admin" }, { isVerified: true }] }),
    Course.countDocuments({ status: { $ne: "archived" } }),
    FreelancerProfile.countDocuments({ status: { $ne: "archived" } }),
    Product.countDocuments({ status: { $ne: "archived" } }),
    Order.countDocuments({}),
    ShopProfile.countDocuments({ status: { $ne: "archived" } }),
    ContactMessage.countDocuments({ status: { $in: ["new", "read"] } }),
    Course.countDocuments({ status: { $in: ["submitted", "changes_requested"] } }),
    FreelancerProfile.countDocuments({ status: { $in: ["submitted", "changes_requested"] } }),
    Product.countDocuments({ status: { $in: ["submitted", "changes_requested"] } }),
    ShopProfile.countDocuments({ status: { $in: ["submitted", "changes_requested"] } }),
    JobPost.countDocuments({ status: "draft" }),
    WalletTransaction.aggregate([
      { $match: { status: "completed", direction: "credit", type: { $in: revenueTypes } } },
      { $group: { _id: "$currency", total: { $sum: "$amount" } } }
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: chartStart },
          status: "completed",
          direction: "credit",
          currency: "FRW",
          type: { $in: revenueTypes }
        }
      },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, value: { $sum: "$amount" } } },
      { $sort: { _id: 1 } }
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: chartStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, value: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    User.find({}).sort({ createdAt: -1 }).limit(4).select("name email createdAt").lean(),
    Course.find({}).sort({ createdAt: -1 }).limit(4).select("title instructorName createdAt status").lean(),
    FreelancerProfile.find({}).sort({ createdAt: -1 }).limit(4).select("name specialty createdAt status").lean(),
    Product.find({}).sort({ createdAt: -1 }).limit(4).select("name sellerName createdAt status").lean(),
    WalletTransaction.find({}).sort({ createdAt: -1 }).limit(4).select("amount currency userEmail createdAt status").lean(),
    Course.find({ status: { $in: ["published", "approved"] } })
      .sort({ enrolledCount: -1, rating: -1 })
      .limit(5)
      .select("title instructorName enrolledCount rating price currency image")
      .lean()
  ]);

  const revenueByCurrency = new Map(
    (completedRevenue as Array<{ _id: "FRW" | "USD"; total: number }>).map((row) => [row._id, Number(row.total ?? 0)])
  );
  const revenueMap = new Map((revenueTrendRows as Array<{ _id: string; value: number }>).map((row) => [row._id, Number(row.value)]));
  const growthMap = new Map((userGrowthRows as Array<{ _id: string; value: number }>).map((row) => [row._id, Number(row.value)]));

  const recentActivity = [
    ...newestUsers.map((item) => ({
      id: `user-${item._id}`,
      kind: "user" as const,
      title: item.name || item.email,
      detail: "registered a new account",
      at: dateValue(item.createdAt),
      href: `/admin/users/${item._id}`
    })),
    ...newestCourses.map((item) => ({
      id: `course-${item._id}`,
      kind: "course" as const,
      title: item.title,
      detail: `${item.status} course by ${item.instructorName}`,
      at: dateValue(item.createdAt),
      href: "/admin/courses"
    })),
    ...newestFreelancers.map((item) => ({
      id: `freelancer-${item._id}`,
      kind: "freelancer" as const,
      title: item.name,
      detail: `${item.status} freelancer profile`,
      at: dateValue(item.createdAt),
      href: "/admin/freelancers"
    })),
    ...newestProducts.map((item) => ({
      id: `product-${item._id}`,
      kind: "product" as const,
      title: item.name,
      detail: `${item.status} product by ${item.sellerName}`,
      at: dateValue(item.createdAt),
      href: "/admin/marketplace/products"
    })),
    ...newestTransactions.map((item) => ({
      id: `payment-${item._id}`,
      kind: "payment" as const,
      title: `${item.currency} ${Number(item.amount ?? 0).toLocaleString()}`,
      detail: `${item.status} payment from ${item.userEmail}`,
      at: dateValue(item.createdAt),
      href: "/admin/payments"
    }))
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7);

  return {
    metrics: {
      users: totalUsers,
      activeUsers,
      courses: totalCourses,
      freelancers: totalFreelancers,
      products: totalProducts,
      orders: totalOrders,
      revenueFRW: revenueByCurrency.get("FRW") ?? 0,
      revenueUSD: revenueByCurrency.get("USD") ?? 0,
      premiumMembers
    },
    pendingApprovals: [
      { label: "Courses", value: pendingCourses, href: "/admin/courses", kind: "course" },
      { label: "Freelancer profiles", value: pendingFreelancers, href: "/admin/freelancers", kind: "freelancer" },
      { label: "Products", value: pendingProducts, href: "/admin/marketplace/products", kind: "product" },
      { label: "Businesses", value: pendingBusinesses, href: "/admin/shops", kind: "business" },
      { label: "Jobs", value: pendingJobs, href: "/admin/jobs", kind: "job" }
    ],
    revenueTrend: months.map((month) => ({ label: month.label, value: revenueMap.get(month.key) ?? 0 })),
    userGrowth: months.map((month) => ({ label: month.label, value: growthMap.get(month.key) ?? 0 })),
    recentActivity,
    topCourses: topCourses.map((course) => ({
      id: String(course._id),
      title: course.title,
      instructor: course.instructorName,
      students: Number(course.enrolledCount ?? 0),
      revenue: Number(course.enrolledCount ?? 0) * Number(course.price ?? 0),
      currency: course.currency === "FRW" ? "FRW" : "USD",
      rating: Number(course.rating ?? 0),
      image: course.image ?? ""
    })),
    system: {
      activeUsers,
      totalUsers,
      catalogRecords: totalCourses + totalProducts + totalFreelancers + totalBusinesses,
      openSupport,
      pendingApprovals: pendingCourses + pendingFreelancers + pendingProducts + pendingBusinesses + pendingJobs
    }
  };
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();
  return <AdminDashboardOverview data={data} />;
}
