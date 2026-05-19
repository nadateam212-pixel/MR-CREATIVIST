import ContactMessage from "@/models/ContactMessage";
import { contactMessageSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole } from "@/lib/mongo-api";

export async function GET(request: Request) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);
    const { limit, skip } = parsePagination(request);
    const [items, total] = await Promise.all([
      ContactMessage.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactMessage.countDocuments({})
    ]);

    return jsonOk({ items, total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const body = contactMessageSchema.parse(await readJson(request));
    const message = await ContactMessage.create(body);

    return jsonOk({ item: message, message: "Message received. We will reply soon." }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
