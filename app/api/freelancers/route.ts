import FreelancerProfile from "@/models/FreelancerProfile";
import { freelancerProfileSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeFreelancer, slugify } from "@/lib/platform-db";
import { studioTrackId } from "@/lib/studio-identity";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: "published" };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ name: term }, { role: term }, { specialty: term }, { location: term }, { skills: term }];
    }

    const [items, total] = await Promise.all([
      FreelancerProfile.find(filter).sort({ rating: -1, completedJobs: -1 }).skip(skip).limit(limit).lean(),
      FreelancerProfile.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeFreelancer), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "freelancer"]);

    const body = freelancerProfileSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(FreelancerProfile, body.slug ?? slugify(body.name));
    const profile = await FreelancerProfile.create({
      ...body,
      slug,
      studioId: studioTrackId(session.user),
      userId: session.user.id,
      status: session.user.role === "admin" ? body.status : body.status === "draft" ? "draft" : "published",
      isVerified: session.user.role === "admin" ? body.isVerified : false
    });

    return jsonOk(normalizeFreelancer(profile), 201);
  } catch (error) {
    return jsonError(error);
  }
}
