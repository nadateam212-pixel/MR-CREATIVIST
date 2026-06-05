import Product from "@/models/Product";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, submittedFields, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeProduct, slugify } from "@/lib/platform-db";
import { productSchema } from "@/lib/mongo-validations";
import { revalidatePublicContent } from "@/lib/public-revalidation";

export async function GET(_: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    await requireMongo();
    const { productId } = await context.params;
    const product = await Product.findOne(mongoIdOrSlug(productId))
      .populate("sellerId", "name email phone profileImage isVerified")
      .lean();

    if (!product) return jsonOk({ error: "Product not found." }, 404);

    return jsonOk(normalizeProduct(product));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "seller"]);

    const { productId } = await context.params;
    const existing = await Product.findOne(mongoIdOrSlug(productId));
    if (!existing) return jsonOk({ error: "Product not found." }, 404);
    const isAdmin = session.user.role === "admin";
    const ownsProduct = existing.sellerId && String(existing.sellerId) === String(session.user.id);

    if (!isAdmin && !ownsProduct) return jsonOk({ error: "You can only manage products created by your Studio account." }, 403);

    const rawBody = await readJson(request);
    const body = submittedFields(rawBody, productSchema.partial().parse(rawBody)) as Partial<ReturnType<typeof productSchema.parse>>;
    const patch = {
      ...body,
      ...(isAdmin ? {} : { status: body.status === "draft" ? "draft" : "published", isVerified: existing.isVerified })
    };
    if (body.slug || body.name) {
      patch.slug = await uniqueSlugFor(Product, body.slug ?? slugify(body.name), existing._id);
    }

    const product = await Product.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true })
      .populate("sellerId", "name email phone profileImage isVerified");
    revalidatePublicContent("product", existing.slug);
    revalidatePublicContent("product", product?.slug);

    return jsonOk(normalizeProduct(product));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "seller"]);

    const { productId } = await context.params;
    const existing = await Product.findOne(mongoIdOrSlug(productId));

    if (!existing) return jsonOk({ error: "Product not found." }, 404);
    const isAdmin = session.user.role === "admin";
    const ownsProduct = existing.sellerId && String(existing.sellerId) === String(session.user.id);
    if (!isAdmin && !ownsProduct) return jsonOk({ error: "You can only archive products created by your Studio account." }, 403);

    if (isAdmin && new URL(request.url).searchParams.get("hard") === "1") {
      await Product.findByIdAndDelete(existing._id);
      revalidatePublicContent("product", existing.slug);
      return jsonOk({ ok: true, deleted: true });
    }

    const product = await Product.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" })
      .populate("sellerId", "name email phone profileImage isVerified");
    revalidatePublicContent("product", existing.slug);

    return jsonOk({ ok: true, item: normalizeProduct(product) });
  } catch (error) {
    return jsonError(error);
  }
}
