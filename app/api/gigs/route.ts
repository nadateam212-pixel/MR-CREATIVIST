import Gig from "@/models/Gig";
import { gigSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeGig, slugify } from "@/lib/platform-db";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { searchParams } = new URL(request.url);
    const { limit, skip, q } = parsePagination(request);
    const ownerId = searchParams.get("ownerId");
    const all = searchParams.get("all") === "true";
    const filter: Record<string, unknown> = { status: "published" };

    if (all || ownerId) {
      const session = await requireRole(request, ["admin", "freelancer"]);
      const isAdmin = session.user.role === "admin";
      filter.status = { $ne: "archived" };
      filter.ownerId = isAdmin && ownerId ? ownerId : session.user.id;
    }

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { category: term }, { packageName: term }, { ownerName: term }, { tags: term }];
    }

    const [items, total] = await Promise.all([
      Gig.find(filter).sort({ isFeatured: -1, rating: -1, orders: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Gig.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeGig), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "freelancer"]);
    const body = gigSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(Gig, body.slug ?? slugify(body.title));
    const isAdmin = session.user.role === "admin";
    const gig = await Gig.create({
      ...body,
      slug,
      ownerId: session.user.id,
      ownerName: body.ownerName || session.user.name || session.user.email,
      status: isAdmin ? body.status : body.status === "draft" ? "draft" : "submitted",
      isVerified: isAdmin ? body.isVerified : false
    });

    return jsonOk(normalizeGig(gig), 201);
  } catch (error) {
    return jsonError(error);
  }
}
