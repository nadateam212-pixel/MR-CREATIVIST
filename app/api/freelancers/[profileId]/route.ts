import FreelancerProfile from "@/models/FreelancerProfile";
import { freelancerProfileSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, submittedFields, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeFreelancer, slugify } from "@/lib/platform-db";

export async function GET(_: Request, context: { params: Promise<{ profileId: string }> }) {
  try {
    await requireMongo();
    const { profileId } = await context.params;
    const profile = await FreelancerProfile.findOne(mongoIdOrSlug(profileId))
      .populate("userId", "name email phone profileImage isVerified socialLinks createdAt")
      .lean();

    if (!profile) return jsonOk({ error: "Freelancer profile not found." }, 404);

    return jsonOk(normalizeFreelancer(profile));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ profileId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "freelancer"]);

    const { profileId } = await context.params;
    const existing = await FreelancerProfile.findOne(mongoIdOrSlug(profileId));
    if (!existing) return jsonOk({ error: "Freelancer profile not found." }, 404);
    const isAdmin = session.user.role === "admin";
    const ownsProfile = existing.userId && String(existing.userId) === String(session.user.id);
    if (!isAdmin && !ownsProfile) return jsonOk({ error: "You can only manage your own freelancer profile." }, 403);

    const rawBody = await readJson(request);
    const body = submittedFields(rawBody, freelancerProfileSchema.partial().parse(rawBody)) as Partial<ReturnType<typeof freelancerProfileSchema.parse>>;
    const patch = {
      ...body,
      ...(isAdmin ? {} : { status: body.status === "draft" ? "draft" : "published", isVerified: existing.isVerified })
    };
    if (body.slug || body.name) {
      patch.slug = await uniqueSlugFor(FreelancerProfile, body.slug ?? slugify(body.name), existing._id);
    }

    const profile = await FreelancerProfile.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true })
      .populate("userId", "name email phone profileImage isVerified socialLinks createdAt");

    return jsonOk(normalizeFreelancer(profile));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ profileId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "freelancer"]);

    const { profileId } = await context.params;
    const existing = await FreelancerProfile.findOne(mongoIdOrSlug(profileId));

    if (!existing) return jsonOk({ error: "Freelancer profile not found." }, 404);
    const isAdmin = session.user.role === "admin";
    const ownsProfile = existing.userId && String(existing.userId) === String(session.user.id);
    if (!isAdmin && !ownsProfile) return jsonOk({ error: "You can only archive your own freelancer profile." }, 403);

    if (isAdmin && new URL(request.url).searchParams.get("hard") === "1") {
      await FreelancerProfile.findByIdAndDelete(existing._id);
      return jsonOk({ ok: true, deleted: true });
    }

    const profile = await FreelancerProfile.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" })
      .populate("userId", "name email phone profileImage isVerified socialLinks createdAt");

    return jsonOk({ ok: true, item: normalizeFreelancer(profile) });
  } catch (error) {
    return jsonError(error);
  }
}
