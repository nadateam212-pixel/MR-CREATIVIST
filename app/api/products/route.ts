import Product from "@/models/Product";
import User from "@/models/User";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeProduct, slugify } from "@/lib/platform-db";
import { productSchema } from "@/lib/mongo-validations";
import { revalidatePublicContent } from "@/lib/public-revalidation";
import { studioTrackId } from "@/lib/studio-identity";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: { $ne: "archived" } };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ name: term }, { category: term }, { sellerName: term }, { type: term }];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .select("name slug type sellerId sellerName price compareAtPrice currency category location stock rating downloads delivery images tools status isFeatured isVerified createdAt updatedAt")
        .populate({ path: "sellerId", select: "name email phone profileImage isVerified", model: User })
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map((item) => normalizeProduct(item, { includeImages: true })), total });
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
      status: session.user.role === "admin" ? body.status : body.status === "draft" ? "draft" : "submitted",
      isVerified: session.user.role === "admin" ? body.isVerified : false
    });
    revalidatePublicContent("product", product.slug);

    return jsonOk(normalizeProduct(product), 201);
  } catch (error) {
    return jsonError(error);
  }
}
