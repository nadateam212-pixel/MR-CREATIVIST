import Order from "@/models/Order";
import Product from "@/models/Product";
import { orderSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, parsePagination, readJson, requireMongo } from "@/lib/mongo-api";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip } = parsePagination(request);
    const [items, total] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments({})
    ]);

    return jsonOk({ items, total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const body = orderSchema.parse(await readJson(request));
    const orderItems = [];

    for (const item of body.items) {
      const product = await Product.findOne(mongoIdOrSlug(item.productId)).lean();
      if (!product) return jsonOk({ error: `Product not found: ${item.productId}` }, 404);

      orderItems.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        quantity: item.quantity,
        unitPrice: product.price
      });
    }

    const subtotal = orderItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    const total = Math.max(0, subtotal - body.discount + body.tax);
    const order = await Order.create({
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      items: orderItems,
      subtotal,
      discount: body.discount,
      tax: body.tax,
      total,
      paymentMethod: body.paymentMethod,
      status: "paid"
    });

    await Promise.all(
      orderItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity, downloads: item.quantity }
        })
      )
    );

    return jsonOk({ item: order, message: "Order saved." }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
