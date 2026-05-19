import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { newsletterSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, readJson, requireMongo } from "@/lib/mongo-api";

export async function POST(request: Request) {
  try {
    await requireMongo();
    const body = newsletterSchema.parse(await readJson(request));
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email: body.email },
      { ...body, status: "active" },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    return jsonOk({ item: subscriber, message: "Subscription saved." }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
