import MultimediaProject from "@/models/MultimediaProject";
import { multimediaProjectSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { slugify } from "@/lib/platform-db";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: { $ne: "archived" } };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { type: term }, { creatorName: term }, { services: term }];
    }

    const [items, total] = await Promise.all([
      MultimediaProject.find(filter).sort({ likes: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      MultimediaProject.countDocuments(filter)
    ]);

    return jsonOk({ items, total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    await requireRole(request, ["admin", "freelancer", "seller"]);

    const body = multimediaProjectSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(MultimediaProject, body.slug ?? slugify(body.title));
    const project = await MultimediaProject.create({ ...body, slug });

    return jsonOk(project, 201);
  } catch (error) {
    return jsonError(error);
  }
}
