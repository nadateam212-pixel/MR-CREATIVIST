import { auth } from "@/auth";
import { jsonOk, readJson } from "@/lib/mongo-api";
import { publicPaymentErrorMessage } from "@/lib/payment-errors";
import { processCourseCheckout } from "@/lib/payment-checkout";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const result = await processCourseCheckout(session, await readJson(request));

    return jsonOk(result, 201);
  } catch (error) {
    return Response.json(
      { error: publicPaymentErrorMessage(error, "Course payment could not be processed.") },
      { status: 422 }
    );
  }
}
