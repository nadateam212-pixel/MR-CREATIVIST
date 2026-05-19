import ConsultingService from "@/models/ConsultingService";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeConsultingService, slugify } from "@/lib/platform-db";
import { consultingServiceSchema } from "@/lib/mongo-validations";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: "published" };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { expertName: term }, { expertTitle: term }, { expertise: term }];
    }

    const [items, total] = await Promise.all([
      ConsultingService.find(filter).sort({ rating: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      ConsultingService.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeConsultingService), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    await requireRole(request, ["admin", "consultant"]);

    const body = consultingServiceSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(ConsultingService, body.slug ?? slugify(body.expertName || body.title));
    const service = await ConsultingService.create({ ...body, slug });

    return jsonOk(normalizeConsultingService(service), 201);
  } catch (error) {
    return jsonError(error);
  }
}
