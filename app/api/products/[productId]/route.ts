import Product from "@/models/Product";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeProduct, slugify } from "@/lib/platform-db";
import { productSchema } from "@/lib/mongo-validations";

export async function GET(_: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    await requireMongo();
    const { productId } = await context.params;
    const product = await Product.findOne(mongoIdOrSlug(productId)).lean();

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

    const body = productSchema.partial().parse(await readJson(request));
    const patch = {
      ...body,
      ...(isAdmin ? {} : { status: body.status === "draft" ? "draft" : "submitted", isVerified: existing.isVerified })
    };
    if (body.slug || body.name) {
      patch.slug = await uniqueSlugFor(Product, body.slug ?? slugify(body.name), existing._id);
    }

    const product = await Product.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true });

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

    const product = await Product.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" });

    return jsonOk({ ok: true, item: normalizeProduct(product) });
  } catch (error) {
    return jsonError(error);
  }
}
