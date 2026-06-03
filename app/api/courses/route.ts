import Course from "@/models/Course";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeCourse, slugify } from "@/lib/platform-db";
import { courseSchema } from "@/lib/mongo-validations";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: "published" };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { category: term }, { instructorName: term }];
    }

    const [items, total] = await Promise.all([
      Course.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Course.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeCourse), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "instructor"]);

    const body = courseSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(Course, body.slug ?? slugify(body.title));
    const course = await Course.create({
      ...body,
      slug,
      instructorId: session.user.id
    });

    return jsonOk(normalizeCourse(course), 201);
  } catch (error) {
    return jsonError(error);
  }
}
