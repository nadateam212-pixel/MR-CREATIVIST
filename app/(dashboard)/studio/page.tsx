import type { Metadata } from "next";
import { auth } from "@/auth";
import { StudioDashboard, type StudioSummary } from "@/components/platform/studio-dashboard";
import connectMongoDB from "@/lib/mongodb";
import { studioTrackId } from "@/lib/studio-identity";
import ConsultingService from "@/models/ConsultingService";
import Course from "@/models/Course";
import FreelancerProfile from "@/models/FreelancerProfile";
import Gig from "@/models/Gig";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";

export const metadata: Metadata = {
  title: "MrC. Studio"
};

const emptySummary: StudioSummary = {
  courses: 0,
  products: 0,
  gigs: 0,
  businesses: 0,
  consulting: 0,
  freelancerProfiles: 0,
  published: 0,
  drafts: 0,
  review: 0,
  archived: 0,
  verified: 0,
  total: 0
};

function ownerQuery(ownerField: string, userId: string, studioId: string) {
  return { $or: [{ [ownerField]: userId }, { studioId }] };
}

function active(query: Record<string, unknown>) {
  return { ...query, status: { $ne: "archived" } };
}

async function getStudioSummary(userId: string, studioId: string): Promise<StudioSummary> {
  await connectMongoDB();

  const courseQuery = ownerQuery("instructorId", userId, studioId);
  const productQuery = ownerQuery("sellerId", userId, studioId);
  const gigQuery = ownerQuery("ownerId", userId, studioId);
  const shopQuery = ownerQuery("ownerId", userId, studioId);
  const consultingQuery = ownerQuery("expertId", userId, studioId);
  const freelancerQuery = ownerQuery("userId", userId, studioId);
  const reviewStatuses = ["submitted", "changes_requested", "approved"];

  const [
    courses,
    products,
    gigs,
    businesses,
    consulting,
    freelancerProfiles,
    published,
    drafts,
    review,
    archived,
    verifiedCourses,
    verifiedProducts,
    verifiedGigs,
    verifiedBusinesses,
    verifiedConsulting,
    verifiedFreelancers
  ] = await Promise.all([
    Course.countDocuments(active(courseQuery)),
    Product.countDocuments(active(productQuery)),
    Gig.countDocuments(active(gigQuery)),
    ShopProfile.countDocuments(active(shopQuery)),
    ConsultingService.countDocuments(active(consultingQuery)),
    FreelancerProfile.countDocuments(active(freelancerQuery)),
    Promise.all([
      Course.countDocuments({ ...courseQuery, status: "published" }),
      Product.countDocuments({ ...productQuery, status: "published" }),
      Gig.countDocuments({ ...gigQuery, status: "published" }),
      ShopProfile.countDocuments({ ...shopQuery, status: "published" }),
      ConsultingService.countDocuments({ ...consultingQuery, status: "published" }),
      FreelancerProfile.countDocuments({ ...freelancerQuery, status: "published" })
    ]).then((counts) => counts.reduce((total, count) => total + count, 0)),
    Promise.all([
      Course.countDocuments({ ...courseQuery, status: "draft" }),
      Product.countDocuments({ ...productQuery, status: "draft" }),
      Gig.countDocuments({ ...gigQuery, status: "draft" }),
      ShopProfile.countDocuments({ ...shopQuery, status: "draft" }),
      ConsultingService.countDocuments({ ...consultingQuery, status: "draft" }),
      FreelancerProfile.countDocuments({ ...freelancerQuery, status: "draft" })
    ]).then((counts) => counts.reduce((total, count) => total + count, 0)),
    Promise.all([
      Course.countDocuments({ ...courseQuery, status: { $in: reviewStatuses } }),
      Product.countDocuments({ ...productQuery, status: { $in: reviewStatuses } }),
      Gig.countDocuments({ ...gigQuery, status: { $in: reviewStatuses } }),
      ShopProfile.countDocuments({ ...shopQuery, status: { $in: reviewStatuses } }),
      ConsultingService.countDocuments({ ...consultingQuery, status: { $in: reviewStatuses } }),
      FreelancerProfile.countDocuments({ ...freelancerQuery, status: { $in: reviewStatuses } })
    ]).then((counts) => counts.reduce((total, count) => total + count, 0)),
    Promise.all([
      Course.countDocuments({ ...courseQuery, status: "archived" }),
      Product.countDocuments({ ...productQuery, status: "archived" }),
      Gig.countDocuments({ ...gigQuery, status: "archived" }),
      ShopProfile.countDocuments({ ...shopQuery, status: "archived" }),
      ConsultingService.countDocuments({ ...consultingQuery, status: "archived" }),
      FreelancerProfile.countDocuments({ ...freelancerQuery, status: "archived" })
    ]).then((counts) => counts.reduce((total, count) => total + count, 0)),
    Course.countDocuments({ ...courseQuery, status: { $in: ["approved", "published"] } }),
    Product.countDocuments({ ...productQuery, isVerified: true }),
    Gig.countDocuments({ ...gigQuery, isVerified: true }),
    ShopProfile.countDocuments({ ...shopQuery, isVerified: true }),
    ConsultingService.countDocuments({ ...consultingQuery, isVerified: true }),
    FreelancerProfile.countDocuments({ ...freelancerQuery, isVerified: true })
  ]);
  const total = courses + products + gigs + businesses + consulting + freelancerProfiles;

  return {
    courses,
    products,
    gigs,
    businesses,
    consulting,
    freelancerProfiles,
    published,
    drafts,
    review,
    archived,
    verified: verifiedCourses + verifiedProducts + verifiedGigs + verifiedBusinesses + verifiedConsulting + verifiedFreelancers,
    total
  };
}

export default async function StudioPage() {
  const session = await auth();
  const studioId = studioTrackId(session?.user);
  const summary = session?.user?.id ? await getStudioSummary(session.user.id, studioId).catch(() => emptySummary) : emptySummary;

  return (
    <StudioDashboard
      owner={{
        name: session?.user?.name,
        email: session?.user?.email,
        studioId,
        role: session?.user?.role,
        accountStatus: session?.user?.accountStatus
      }}
      summary={summary}
    />
  );
}
