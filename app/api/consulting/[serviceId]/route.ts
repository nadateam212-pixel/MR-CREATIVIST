import ConsultingService from "@/models/ConsultingService";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeConsultingService, slugify } from "@/lib/platform-db";
import { consultingServiceSchema } from "@/lib/mongo-validations";

export async function GET(_: Request, context: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireMongo();
    const { serviceId } = await context.params;
    const service = await ConsultingService.findOne(mongoIdOrSlug(serviceId))
      .populate("expertId", "name email phone profileImage isVerified")
      .lean();

    if (!service) return jsonOk({ error: "Consulting service not found." }, 404);

    return jsonOk(normalizeConsultingService(service));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "consultant"]);

    const { serviceId } = await context.params;
    const existing = await ConsultingService.findOne(mongoIdOrSlug(serviceId));
    if (!existing) return jsonOk({ error: "Consulting service not found." }, 404);
    const isAdmin = session.user.role === "admin";
    const ownsService = existing.expertId && String(existing.expertId) === String(session.user.id);
    if (!isAdmin && !ownsService) return jsonOk({ error: "You can only manage your own consulting service." }, 403);

    const body = consultingServiceSchema.partial().parse(await readJson(request));
    const patch = {
      ...body,
      ...(isAdmin ? {} : { status: body.status === "draft" ? "draft" : "published", isVerified: existing.isVerified })
    };
    if (body.slug || body.expertName || body.title) {
      patch.slug = await uniqueSlugFor(ConsultingService, body.slug ?? slugify(body.expertName || body.title), existing._id);
    }

    const service = await ConsultingService.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true })
      .populate("expertId", "name email phone profileImage isVerified");

    return jsonOk(normalizeConsultingService(service));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "consultant"]);

    const { serviceId } = await context.params;
    const existing = await ConsultingService.findOne(mongoIdOrSlug(serviceId));

    if (!existing) return jsonOk({ error: "Consulting service not found." }, 404);
    const isAdmin = session.user.role === "admin";
    const ownsService = existing.expertId && String(existing.expertId) === String(session.user.id);
    if (!isAdmin && !ownsService) return jsonOk({ error: "You can only archive your own consulting service." }, 403);

    if (isAdmin && new URL(request.url).searchParams.get("hard") === "1") {
      await ConsultingService.findByIdAndDelete(existing._id);
      return jsonOk({ ok: true, deleted: true });
    }

    const service = await ConsultingService.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" })
      .populate("expertId", "name email phone profileImage isVerified");

    return jsonOk({ ok: true, item: normalizeConsultingService(service) });
  } catch (error) {
    return jsonError(error);
  }
}
