import ConsultingService from "@/models/ConsultingService";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeConsultingService, slugify } from "@/lib/platform-db";
import { consultingServiceSchema } from "@/lib/mongo-validations";

export async function GET(_: Request, context: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireMongo();
    const { serviceId } = await context.params;
    const service = await ConsultingService.findOne(mongoIdOrSlug(serviceId)).lean();

    if (!service) return jsonOk({ error: "Consulting service not found." }, 404);

    return jsonOk(normalizeConsultingService(service));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin", "consultant"]);

    const { serviceId } = await context.params;
    const existing = await ConsultingService.findOne(mongoIdOrSlug(serviceId));
    if (!existing) return jsonOk({ error: "Consulting service not found." }, 404);

    const body = consultingServiceSchema.partial().parse(await readJson(request));
    const patch = { ...body };
    if (body.slug || body.expertName || body.title) {
      patch.slug = await uniqueSlugFor(ConsultingService, body.slug ?? slugify(body.expertName || body.title), existing._id);
    }

    const service = await ConsultingService.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true });

    return jsonOk(normalizeConsultingService(service));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ serviceId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin", "consultant"]);

    const { serviceId } = await context.params;
    const service = await ConsultingService.findOneAndUpdate(mongoIdOrSlug(serviceId), { status: "archived" }, { returnDocument: "after" });

    if (!service) return jsonOk({ error: "Consulting service not found." }, 404);

    return jsonOk({ ok: true, item: normalizeConsultingService(service) });
  } catch (error) {
    return jsonError(error);
  }
}
