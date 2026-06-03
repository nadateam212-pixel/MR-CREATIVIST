import Gig from "@/models/Gig";
import { gigSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeGig, slugify } from "@/lib/platform-db";

export async function GET(_: Request, context: { params: Promise<{ gigId: string }> }) {
  try {
    await requireMongo();
    const { gigId } = await context.params;
    const gig = await Gig.findOne(mongoIdOrSlug(gigId)).lean();

    if (!gig) return jsonOk({ error: "Gig not found." }, 404);

    return jsonOk(normalizeGig(gig));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ gigId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "freelancer"]);
    const { gigId } = await context.params;
    const existing = await Gig.findOne(mongoIdOrSlug(gigId));

    if (!existing) return jsonOk({ error: "Gig not found." }, 404);

    const isAdmin = session.user.role === "admin";
    const ownsGig = existing.ownerId && String(existing.ownerId) === String(session.user.id);
    if (!isAdmin && !ownsGig) return jsonOk({ error: "You can only manage gigs created by your Studio account." }, 403);

    const body = gigSchema.partial().parse(await readJson(request));
    const patch: Record<string, unknown> = {
      ...body,
      ...(isAdmin ? {} : { status: body.status === "draft" ? "draft" : "submitted", isVerified: existing.isVerified })
    };

    if (body.slug || body.title) {
      patch.slug = await uniqueSlugFor(Gig, body.slug ?? slugify(body.title), existing._id);
    }

    const gig = await Gig.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true });

    return jsonOk(normalizeGig(gig));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ gigId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "freelancer"]);
    const { gigId } = await context.params;
    const existing = await Gig.findOne(mongoIdOrSlug(gigId));

    if (!existing) return jsonOk({ error: "Gig not found." }, 404);

    const isAdmin = session.user.role === "admin";
    const ownsGig = existing.ownerId && String(existing.ownerId) === String(session.user.id);
    if (!isAdmin && !ownsGig) return jsonOk({ error: "You can only archive gigs created by your Studio account." }, 403);

    const gig = await Gig.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" });

    return jsonOk({ ok: true, item: normalizeGig(gig) });
  } catch (error) {
    return jsonError(error);
  }
}
