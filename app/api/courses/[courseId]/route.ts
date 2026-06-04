import Course from "@/models/Course";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeCourse, slugify } from "@/lib/platform-db";
import { courseSchema } from "@/lib/mongo-validations";
import { studioTrackId } from "@/lib/studio-identity";
import { compileCoursePublicationPatch } from "@/lib/course-publication";

function normalizedOwner(value?: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function canManageCourse(existing: { instructorId?: unknown; studioId?: unknown; instructorName?: unknown }, user: { id?: string | null; name?: string | null; email?: string | null }) {
  const ownsById = existing.instructorId && user.id && String(existing.instructorId) === String(user.id);
  const ownsByStudio = existing.studioId && String(existing.studioId) === studioTrackId(user);
  const legacyInstructor = normalizedOwner(existing.instructorName);
  const ownsLegacyCourse =
    !existing.instructorId &&
    !existing.studioId &&
    legacyInstructor &&
    [normalizedOwner(user.name), normalizedOwner(user.email)].includes(legacyInstructor);

  return Boolean(ownsById || ownsByStudio || ownsLegacyCourse);
}

function submittedFields<T extends Record<string, unknown>>(raw: unknown, parsed: T) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};

  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => Object.prototype.hasOwnProperty.call(source, key))
  ) as Partial<T>;
}

export async function GET(_: Request, context: { params: Promise<{ courseId: string }> }) {
  try {
    await requireMongo();
    const { courseId } = await context.params;
    const course = await Course.findOne({ ...mongoIdOrSlug(courseId), status: { $ne: "archived" } })
      .populate("instructorId", "name email profileImage isVerified")
      .lean();

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
    const ownsCourse = canManageCourse(existing, session.user);

    if (!isAdmin && !ownsCourse) {
      return jsonOk({ error: "You can only manage courses created by your Studio account." }, 403);
    }

    const rawBody = await readJson(request);
    const body = submittedFields(rawBody, courseSchema.partial().parse(rawBody));
    const patch: Record<string, unknown> = {
      ...body,
      ...(isAdmin
        ? {}
        : {
            status:
              body.status && ["draft", "submitted", "published", "unlisted", "archived"].includes(body.status)
                ? body.status
                : existing.status
          })
    };
    if (body.slug || body.title) {
      patch.slug = await uniqueSlugFor(Course, body.slug ?? slugify(body.title), existing._id);
    }
    const mergedCourse = {
      ...existing.toObject(),
      ...patch
    };
    const publicationPatch = compileCoursePublicationPatch(mergedCourse, String(patch.status ?? existing.status ?? "draft"));

    const course = await Course.findByIdAndUpdate(existing._id, { ...patch, ...publicationPatch }, { returnDocument: "after", runValidators: true })
      .populate("instructorId", "name email profileImage isVerified");

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
    const ownsCourse = canManageCourse(existing, session.user);

    if (!isAdmin && !ownsCourse) {
      return jsonOk({ error: "You can only archive courses created by your Studio account." }, 403);
    }

    if (isAdmin && new URL(request.url).searchParams.get("hard") === "1") {
      await Course.findByIdAndDelete(existing._id);
      return jsonOk({ ok: true, deleted: true });
    }

    const course = await Course.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" });

    return jsonOk({ ok: true, item: normalizeCourse(course) });
  } catch (error) {
    return jsonError(error);
  }
}
