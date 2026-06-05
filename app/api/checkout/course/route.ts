import { auth } from "@/auth";
import { jsonOk, readJson } from "@/lib/mongo-api";
import { processCourseCheckout } from "@/lib/payment-checkout";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const result = await processCourseCheckout(session, await readJson(request));

    return jsonOk(result, 201);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Course payment could not be processed." },
      { status: 422 }
    );
  }
}
