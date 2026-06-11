import Gig from "@/models/Gig";
import User from "@/models/User";
import { gigSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireAuthenticated, requireMongo, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeGig, slugify } from "@/lib/platform-db";
import { revalidatePublicContent } from "@/lib/public-revalidation";
import { studioTrackId } from "@/lib/studio-identity";
import { syncFreelancerProfileFromGig } from "@/lib/freelancer-profile-sync";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { searchParams } = new URL(request.url);
    const { limit, skip, q } = parsePagination(request);
    const ownerId = searchParams.get("ownerId");
    const all = searchParams.get("all") === "true";
    const filter: Record<string, unknown> = { status: { $ne: "archived" } };

    if (all || ownerId) {
      const session = await requireAuthenticated();
      const isAdmin = session.user.role === "admin";
      filter.status = { $ne: "archived" };
      filter.ownerId = isAdmin && ownerId ? ownerId : session.user.id;
    }

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { category: term }, { packageName: term }, { ownerName: term }, { tags: term }];
    }
    const includeRawImage = Boolean(all || ownerId);

    const [items, total] = await Promise.all([
      Gig.find(filter)
        .select(`studioId ownerId ownerName slug title category packageName description price currency deliveryDays revisions ownerAddress ownerCity ownerCountry tags deliverables rating orders status isFeatured isVerified createdAt updatedAt${includeRawImage ? " image" : ""}`)
        .populate({ path: "ownerId", select: "name email phone profileImage isVerified", model: User })
        .sort({ isFeatured: -1, rating: -1, orders: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Gig.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map((item) => normalizeGig(item, { includeImage: includeRawImage })), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireAuthenticated();
    if (session.user.accountStatus === "suspended") return jsonOk({ error: "Account is suspended." }, 403);
    const body = gigSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(Gig, body.slug ?? slugify(body.title));
    const isAdmin = session.user.role === "admin";
    const gig = await Gig.create({
      ...body,
      slug,
      studioId: studioTrackId(session.user),
      ownerId: session.user.id,
      ownerName: body.ownerName || session.user.name || session.user.email,
      status: isAdmin ? body.status : body.status === "draft" ? "draft" : "published",
      isVerified: isAdmin ? body.isVerified : false
    });
    await syncFreelancerProfileFromGig(gig, session.user);
    revalidatePublicContent("gig", gig.slug);

    return jsonOk(normalizeGig(gig), 201);
  } catch (error) {
    return jsonError(error);
  }
}
