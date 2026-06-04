import FreelancerProfile from "@/models/FreelancerProfile";
import User from "@/models/User";
import { slugify } from "@/lib/platform-db";
import { uniqueSlugFor } from "@/lib/mongo-api";

function cleanDoc(doc) {
  return typeof doc?.toObject === "function" ? doc.toObject() : doc;
}

function uniqueValues(items) {
  return Array.from(new Set(items.map((item) => String(item ?? "").trim()).filter(Boolean)));
}

function locationFromGig(gig, user) {
  return [gig.ownerCity, gig.ownerCountry].filter(Boolean).join(", ") || user?.location || "Remote";
}

function profileImageFromGig(gig, user) {
  return user?.profileImage || gig.image || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=85";
}

export async function syncFreelancerProfileFromGig(gigInput, sessionUser = {}) {
  const gig = cleanDoc(gigInput);
  const owner = gig?.ownerId;
  const userId = (typeof owner === "object" && owner?._id ? owner._id : owner) ?? sessionUser.id;
  if (!userId) return null;

  const [user, existing] = await Promise.all([
    User.findById(userId).select("name email profileImage location isVerified").lean(),
    FreelancerProfile.findOne({ userId }).lean()
  ]);
  const name = gig.ownerName || user?.name || sessionUser.name || "MR Creativist Freelancer";
  const skills = uniqueValues([...(gig.tags ?? []), gig.category, gig.packageName]).slice(0, 12);
  const verified = Boolean(user?.isVerified || gig.isVerified || existing?.isVerified);
  const currentGig = {
    title: gig.title,
    price: Number(gig.price ?? 0),
    deliveryDays: Number(gig.deliveryDays ?? 1)
  };
  const gigs = [
    currentGig,
    ...(existing?.gigs ?? []).filter((item) => item?.title !== currentGig.title)
  ].slice(0, 8);
  const patch = {
    studioId: gig.studioId,
    userId,
    name,
    role: existing?.role || `${gig.category || "Creative"} freelancer`,
    specialty: gig.category || existing?.specialty || "Creative services",
    location: locationFromGig(gig, user),
    hourlyRate: Number(gig.price ?? existing?.hourlyRate ?? 0),
    rating: Math.max(Number(existing?.rating ?? 0), Number(gig.rating ?? 0)),
    completedJobs: Math.max(Number(existing?.completedJobs ?? 0), Number(gig.orders ?? 0)),
    responseHours: existing?.responseHours ?? 8,
    availabilityPercent: existing?.availabilityPercent ?? 80,
    portfolioScore: existing?.portfolioScore ?? 75,
    languages: existing?.languages?.length ? existing.languages : ["English"],
    skills: skills.length ? skills : existing?.skills?.length ? existing.skills : ["Creative services"],
    verifiedBadges: verified ? uniqueValues([...(existing?.verifiedBadges ?? []), "Verified freelancer account"]) : existing?.verifiedBadges ?? [],
    image: profileImageFromGig(gig, user),
    bio: existing?.bio || gig.description,
    gigs,
    status: "published",
    isVerified: verified
  };

  if (existing?._id) {
    const [profile] = await Promise.all([
      FreelancerProfile.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true }),
      User.findByIdAndUpdate(userId, { $addToSet: { validatedRoles: { $each: ["client", "freelancer"] } } })
    ]);

    return profile;
  }

  const slug = await uniqueSlugFor(FreelancerProfile, slugify(name) || slugify(gig.title) || "freelancer");
  const [profile] = await Promise.all([
    FreelancerProfile.create({
      ...patch,
      slug
    }),
    User.findByIdAndUpdate(userId, { $addToSet: { validatedRoles: { $each: ["client", "freelancer"] } } })
  ]);

  return profile;
}
