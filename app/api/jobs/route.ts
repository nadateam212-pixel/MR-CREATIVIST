import JobPost from "@/models/JobPost";
import { jobPostSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeJobPost, slugify } from "@/lib/platform-db";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get("all") === "1";

    if (includeDrafts) {
      await requireRole(request, ["admin"]);
    }

    const filter: Record<string, unknown> = { status: { $ne: "archived" } };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { companyName: term }, { category: term }, { location: term }, { skills: term }];
    }

    const [items, total] = await Promise.all([
      JobPost.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      JobPost.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeJobPost), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin"]);
    const body = jobPostSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(JobPost, body.slug ?? slugify(body.title));
    const job = await JobPost.create({
      ...body,
      slug,
      postedById: session.user.id,
      postedByName: session.user.name ?? session.user.email
    });

    return jsonOk(normalizeJobPost(job), 201);
  } catch (error) {
    return jsonError(error);
  }
}
