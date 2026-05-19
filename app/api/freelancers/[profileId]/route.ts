import FreelancerProfile from "@/models/FreelancerProfile";
import { freelancerProfileSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeFreelancer, slugify } from "@/lib/platform-db";

export async function GET(_: Request, context: { params: Promise<{ profileId: string }> }) {
  try {
    await requireMongo();
    const { profileId } = await context.params;
    const profile = await FreelancerProfile.findOne(mongoIdOrSlug(profileId)).lean();

    if (!profile) return jsonOk({ error: "Freelancer profile not found." }, 404);

    return jsonOk(normalizeFreelancer(profile));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ profileId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin", "freelancer"]);

    const { profileId } = await context.params;
    const existing = await FreelancerProfile.findOne(mongoIdOrSlug(profileId));
    if (!existing) return jsonOk({ error: "Freelancer profile not found." }, 404);

    const body = freelancerProfileSchema.partial().parse(await readJson(request));
    const patch = { ...body };
    if (body.slug || body.name) {
      patch.slug = await uniqueSlugFor(FreelancerProfile, body.slug ?? slugify(body.name), existing._id);
    }

    const profile = await FreelancerProfile.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true });

    return jsonOk(normalizeFreelancer(profile));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ profileId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin", "freelancer"]);

    const { profileId } = await context.params;
    const profile = await FreelancerProfile.findOneAndUpdate(mongoIdOrSlug(profileId), { status: "archived" }, { returnDocument: "after" });

    if (!profile) return jsonOk({ error: "Freelancer profile not found." }, 404);

    return jsonOk({ ok: true, item: normalizeFreelancer(profile) });
  } catch (error) {
    return jsonError(error);
  }
}
