import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { FreelancerDetailExperience } from "@/components/platform/freelancer-detail-experience";
import connectMongoDB from "@/lib/mongodb";
import { normalizeFreelancer, normalizeGig } from "@/lib/platform-db";
import FreelancerProfile from "@/models/FreelancerProfile";
import Gig from "@/models/Gig";

export const dynamic = "force-dynamic";

export default async function FreelancerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectMongoDB();
  const candidates: Record<string, unknown>[] = [{ slug }];
  if (mongoose.isValidObjectId(slug)) candidates.push({ _id: slug }, { userId: slug });
  const profile = await FreelancerProfile.findOne({ $or: candidates, status: { $ne: "archived" } })
    .populate("userId", "name email phone profileImage isVerified socialLinks createdAt")
    .lean();
  if (!profile) notFound();
  const gigs = await Gig.find({ ownerId: profile.userId?._id ?? profile.userId, status: "published" }).sort({ orders: -1, createdAt: -1 }).lean();

  return <FreelancerDetailExperience profile={normalizeFreelancer(profile)} gigs={gigs.map((gig) => normalizeGig(gig))} />;
}
