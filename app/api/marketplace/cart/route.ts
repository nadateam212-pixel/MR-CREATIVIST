import { z } from "zod";
import Product from "@/models/Product";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";
import { normalizeProduct } from "@/lib/platform-db";

const cartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1)
});

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
    const product = await Product.findOne(mongoIdOrSlug(body.productId)).lean();

    if (!product) return jsonOk({ error: "Product not found." }, 404);

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
