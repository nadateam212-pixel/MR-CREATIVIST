import AITool from "@/models/AITool";
import { aiToolSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeAITool, slugify } from "@/lib/platform-db";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: "published" };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ name: term }, { category: term }, { description: term }, { features: term }];
    }

    const [items, total] = await Promise.all([
      AITool.find(filter).sort({ usageCount: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      AITool.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeAITool), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);

    const body = aiToolSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(AITool, body.slug ?? slugify(body.name));
    const tool = await AITool.create({ ...body, slug });

    return jsonOk(normalizeAITool(tool), 201);
  } catch (error) {
    return jsonError(error);
  }
}
