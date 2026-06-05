import Course from "@/models/Course";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeCourse, slugify } from "@/lib/platform-db";
import { courseSchema } from "@/lib/mongo-validations";
import { studioTrackId } from "@/lib/studio-identity";
import { compileCoursePublicationPatch } from "@/lib/course-publication";
import { revalidatePublicContent } from "@/lib/public-revalidation";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = { status: { $ne: "archived" } };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { category: term }, { instructorName: term }];
    }

    const [items, total] = await Promise.all([
      Course.find(filter)
        .populate("instructorId", "name email profileImage isVerified")
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
    const status =
      session.user.role === "admin"
        ? body.status
        : ["draft", "submitted", "published", "unlisted"].includes(body.status)
          ? body.status
          : "submitted";
    const baseCourse = {
      ...body,
      slug,
      studioId: studioTrackId(session.user),
      instructorId: session.user.id,
      instructorName: body.instructorName || session.user.name || session.user.email,
      status
    };
    const publicationPatch = compileCoursePublicationPatch(baseCourse, status);
    const course = await Course.create({
      ...baseCourse,
      ...publicationPatch
    });
    revalidatePublicContent("course", course.slug);

    return jsonOk(normalizeCourse(course), 201);
  } catch (error) {
    return jsonError(error);
  }
}
