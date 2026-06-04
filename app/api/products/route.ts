import Product from "@/models/Product";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeProduct, slugify } from "@/lib/platform-db";
import { productSchema } from "@/lib/mongo-validations";
import { studioTrackId } from "@/lib/studio-identity";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: "published" };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ name: term }, { category: term }, { sellerName: term }, { type: term }];
    }

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeProduct), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "seller"]);

    const body = productSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(Product, body.slug ?? slugify(body.name));
    const product = await Product.create({
      ...body,
      slug,
      studioId: studioTrackId(session.user),
      sellerId: session.user.id,
      sellerName: body.sellerName || session.user.name || session.user.email,
      status: session.user.role === "admin" ? body.status : body.status === "draft" ? "draft" : "published",
      isVerified: session.user.role === "admin" ? body.isVerified : false
    });

    return jsonOk(normalizeProduct(product), 201);
  } catch (error) {
    return jsonError(error);
  }
}
