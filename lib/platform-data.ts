import {
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  Video
} from "lucide-react";

export const legacyFeatureMap = [
  "Courses, curricula, lessons, lesson resources, quiz questions, quiz submissions, reviews, enrollments, certificates, and instructor payouts",
  "Marketplace products, categories, featured products, hot deals, inquiries, guest reviews, product likes, downloads, and seller dashboards",
  "Business directory, talent profiles, verification badges, subscription plans, deposits, PayPal, mobile money, and admin approvals",
  "Affiliate referrals, product/course/subscription commissions, payout requests, public referral links, and earnings dashboards",
  "Blogs, blog categories, blog likes, blogger dashboards, platform testimonials, messaging, notifications, settings, and legal pages"
];

export const platformHighlights = [
  {
    title: "Learning engine",
    description: "Courses, video lessons, quizzes, assignments, progress, certificates, reviews, and instructor analytics.",
    icon: GraduationCap
  },
  {
    title: "Commerce marketplace",
    description: "Digital and physical products, cart, wishlist, checkout, coupons, seller analytics, and order operations.",
    icon: ShoppingBag
  },
  {
    title: "Consulting suite",
    description: "Consultant profiles, availability, booking, LiveKit-ready sessions, client notes, ratings, and billing.",
    icon: CalendarDays
  },
  {
    title: "AI operating layer",
    description: "Recommendation hooks, semantic search storage, quiz generation entry points, and consultant matching.",
    icon: Bot
  }
];

export const walletSnapshot = {
  balance: 428,
  pendingBalance: 64,
  totalEarned: 1860,
  totalWithdrawn: 936,
  currency: "USD",
  limits: {
    minimumWithdrawal: 20,
    dailyTransfer: 1200,
    verificationRequiredAbove: 500
  },
  methods: ["Card deposit", "Mobile money", "Bank transfer", "PayPal", "Wallet transfer"]
};

export const certificateTemplates = [
  {
    name: "Professional",
    description: "Clean certificate for course completion, quiz pass, and final project validation.",
    color: "Teal"
  },
  {
    name: "Executive",
    description: "Premium template for instructor programs, advanced bootcamps, and enterprise cohorts.",
    color: "Amber"
  },
  {
    name: "Skill Badge",
    description: "Compact badge certificate for short modules, seller training, and wallet operation courses.",
    color: "Indigo"
  }
];

export const platformWorkflows = [
  {
    title: "Course completion",
    steps: ["Browse", "Preview", "Enroll", "Learn", "Take quizzes", "Submit tests", "Generate certificate"]
  },
  {
    title: "Marketplace purchase",
    steps: ["Discover", "Add to cart", "Apply coupon", "Pay", "Download or track", "Review seller"]
  },
  {
    title: "Wallet movement",
    steps: ["Deposit", "Earn", "Transfer", "Withdraw", "Export transactions", "Approve payout"]
  },
  {
    title: "Admin governance",
    steps: ["Review queues", "Moderate content", "Approve payouts", "Audit activity", "Run backups"]
  }
];

export const dashboardSections = [
  { href: "/dashboard", label: "Student overview", icon: LayoutDashboard },
  { href: "/dashboard/my-courses", label: "My courses", icon: BookOpen },
  { href: "/dashboard/certificates", label: "Certificates", icon: Trophy },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Sparkles },
  { href: "/instructor", label: "Instructor", icon: GraduationCap },
  { href: "/consultant", label: "Consultant", icon: CalendarDays },
  { href: "/seller", label: "Seller", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings }
];

export const adminSections = [
  { href: "/admin/dashboard", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/marketplace/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/marketplace/orders", label: "Orders", icon: Package },
  { href: "/admin/consulting/consultants", label: "Consultants", icon: BriefcaseBusiness },
  { href: "/admin/payments", label: "Payments", icon: HandCoins },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export const capabilityCards = [
  { title: "Video streaming", body: "Mux-ready lesson assets, previews, captions, and offline PWA hooks.", icon: Video },
  { title: "Smart search", body: "Keyword search today, vector embeddings ready for recommendations and typo-tolerant matching.", icon: Bot },
  { title: "Analytics", body: "Revenue, engagement, dropout risk, A/B testing, affiliate attribution, and audit logs.", icon: BarChart3 },
  { title: "Automation", body: "Resend/React Email sequences, webhook hub, Slack/Discord notifications, and calendar sync.", icon: Sparkles }
];
