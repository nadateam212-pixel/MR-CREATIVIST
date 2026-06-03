import Course from "@/models/Course";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeCourse, slugify } from "@/lib/platform-db";
import { courseSchema } from "@/lib/mongo-validations";

export async function GET(_: Request, context: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const { courseId } = await context.params;
    const course = await Course.findOne(mongoIdOrSlug(courseId)).lean();

    if (!course) {
      return jsonOk({ error: "Course not found." }, 404);
    }

    return jsonOk(normalizeCourse(course));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "instructor"]);

    const { courseId } = await context.params;
    const existing = await Course.findOne(mongoIdOrSlug(courseId));
    if (!existing) return jsonOk({ error: "Course not found." }, 404);
    const isAdmin = session.user.role === "admin";
    const ownsCourse = existing.instructorId && String(existing.instructorId) === String(session.user.id);

    if (!isAdmin && !ownsCourse) {
      return jsonOk({ error: "You can only manage courses created by your Studio account." }, 403);
    }

    const body = courseSchema.partial().parse(await readJson(request));
    const patch = { ...body };
    if (body.slug || body.title) {
      patch.slug = await uniqueSlugFor(Course, body.slug ?? slugify(body.title), existing._id);
    }

    const course = await Course.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true });

    return jsonOk(normalizeCourse(course));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "instructor"]);

    const { courseId } = await context.params;
    const existing = await Course.findOne(mongoIdOrSlug(courseId));

    if (!existing) {
      return jsonOk({ error: "Course not found." }, 404);
    }

    const isAdmin = session.user.role === "admin";
    const ownsCourse = existing.instructorId && String(existing.instructorId) === String(session.user.id);

    if (!isAdmin && !ownsCourse) {
      return jsonOk({ error: "You can only archive courses created by your Studio account." }, 403);
    }

    const course = await Course.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" });

    return jsonOk({ ok: true, item: normalizeCourse(course) });
  } catch (error) {
    return jsonError(error);
  }
}
