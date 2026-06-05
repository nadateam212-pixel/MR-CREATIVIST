import { auth } from "@/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mongo-api";
import { processCourseCheckout } from "@/lib/payment-checkout";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const result = await processCourseCheckout(session, await readJson(request));

    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
