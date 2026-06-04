import { z } from "zod";
import Product from "@/models/Product";
import User from "@/models/User";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";
import { normalizeProduct } from "@/lib/platform-db";

const cartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1)
});

async function productAllowsCheckout(product: { sellerId?: unknown }) {
  const sellerId =
    product.sellerId && typeof product.sellerId === "object" && "_id" in product.sellerId
      ? product.sellerId._id
      : product.sellerId;
  if (!sellerId) return false;

  const verifiedSeller = await User.exists({ _id: sellerId, isVerified: true });
  return Boolean(verifiedSeller);
}

export async function GET() {
  return jsonOk({
    items: [],
    totals: { subtotal: 0, discount: 0, tax: 0, total: 0 },
    mode: "guest-cart"
  });
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const body = cartSchema.parse(await readJson(request));
    const product = await Product.findOne(mongoIdOrSlug(body.productId))
      .populate("sellerId", "name email phone profileImage isVerified")
      .lean();

    if (!product) return jsonOk({ error: "Product not found." }, 404);
    if (product.status !== "published") return jsonOk({ error: "Product is not available for checkout." }, 403);
    if (!(await productAllowsCheckout(product))) {
      return jsonOk({ error: "This seller is not verified for online checkout yet. Contact the seller directly." }, 403);
    }

    return jsonOk(
      {
        item: {
          product: normalizeProduct(product),
          quantity: body.quantity
        },
        mode: "guest-cart"
      },
      201
    );
  } catch (error) {
    return jsonError(error);
  }
}
