import { auth } from "@/auth";
import Order from "@/models/Order";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo } from "@/lib/mongo-api";
import { processProductCheckout } from "@/lib/payment-checkout";

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
    const session = await auth();
    const result = await processProductCheckout(session, await readJson(request));

    return jsonOk(
      {
        item: result.order,
        transaction: result.transaction,
        status: result.status,
        approvalUrl: result.approvalUrl,
        message: result.message
      },
      201
    );
  } catch (error) {
    return jsonError(error);
  }
}
