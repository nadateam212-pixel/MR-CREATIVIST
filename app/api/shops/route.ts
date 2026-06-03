import ShopProfile from "@/models/ShopProfile";
import { shopProfileSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeShopProfile, slugify } from "@/lib/platform-db";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get("all") === "1";
    let session: Awaited<ReturnType<typeof requireRole>> | null = null;

    if (includeDrafts) {
      session = await requireRole(request, ["admin", "seller"]);
    }

    const filter: Record<string, unknown> = includeDrafts ? { status: { $ne: "archived" } } : { status: "published" };
    if (includeDrafts && session?.user.role !== "admin") {
      filter.ownerId = session?.user.id;
    }

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ name: term }, { category: term }, { city: term }, { country: term }, { tags: term }];
    }

    const [items, total] = await Promise.all([
      ShopProfile.find(filter).sort({ isFeatured: -1, rating: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      ShopProfile.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeShopProfile), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "seller"]);
    const body = shopProfileSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(ShopProfile, body.slug ?? slugify(body.name));
    const shop = await ShopProfile.create({
      ...body,
      slug,
      ownerId: session.user.id,
      ownerName: session.user.name ?? session.user.email,
      status: session.user.role === "admin" ? body.status : body.status === "draft" ? "draft" : "submitted",
      isVerified: session.user.role === "admin" ? body.isVerified : false
    });

    return jsonOk(normalizeShopProfile(shop), 201);
  } catch (error) {
    return jsonError(error);
  }
}
