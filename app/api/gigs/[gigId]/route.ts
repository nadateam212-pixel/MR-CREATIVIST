import Gig from "@/models/Gig";
import { gigSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireAuthenticated, requireMongo, submittedFields, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeGig, slugify } from "@/lib/platform-db";
import { syncFreelancerProfileFromGig } from "@/lib/freelancer-profile-sync";

export async function GET(_: Request, context: { params: Promise<{ gigId: string }> }) {
  try {
    await requireMongo();
    const { gigId } = await context.params;
    const gig = await Gig.findOne(mongoIdOrSlug(gigId))
      .populate("ownerId", "name email phone profileImage isVerified")
      .lean();

    if (!gig) return jsonOk({ error: "Gig not found." }, 404);

    return jsonOk(normalizeGig(gig));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ gigId: string }> }) {
  try {
    await requireMongo();
    const session = await requireAuthenticated();
    if (session.user.accountStatus === "suspended") return jsonOk({ error: "Account is suspended." }, 403);
    const { gigId } = await context.params;
    const existing = await Gig.findOne(mongoIdOrSlug(gigId));

    if (!existing) return jsonOk({ error: "Gig not found." }, 404);

    const isAdmin = session.user.role === "admin";
    const ownsGig = existing.ownerId && String(existing.ownerId) === String(session.user.id);
    if (!isAdmin && !ownsGig) return jsonOk({ error: "You can only manage gigs created by your Studio account." }, 403);

    const rawBody = await readJson(request);
    const body = submittedFields(rawBody, gigSchema.partial().parse(rawBody)) as Partial<ReturnType<typeof gigSchema.parse>>;
    const patch: Record<string, unknown> = {
      ...body,
      ...(isAdmin ? {} : { status: body.status === "draft" ? "draft" : "published", isVerified: existing.isVerified })
    };

    if (body.slug || body.title) {
      patch.slug = await uniqueSlugFor(Gig, body.slug ?? slugify(body.title), existing._id);
    }

    const gig = await Gig.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true })
      .populate("ownerId", "name email phone profileImage isVerified");
    await syncFreelancerProfileFromGig(gig, session.user);

    return jsonOk(normalizeGig(gig));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ gigId: string }> }) {
  try {
    await requireMongo();
    const session = await requireAuthenticated();
    if (session.user.accountStatus === "suspended") return jsonOk({ error: "Account is suspended." }, 403);
    const { gigId } = await context.params;
    const existing = await Gig.findOne(mongoIdOrSlug(gigId));

    if (!existing) return jsonOk({ error: "Gig not found." }, 404);

    const isAdmin = session.user.role === "admin";
    const ownsGig = existing.ownerId && String(existing.ownerId) === String(session.user.id);
    if (!isAdmin && !ownsGig) return jsonOk({ error: "You can only archive gigs created by your Studio account." }, 403);

    if (isAdmin && new URL(request.url).searchParams.get("hard") === "1") {
      await Gig.findByIdAndDelete(existing._id);
      return jsonOk({ ok: true, deleted: true });
    }

    const gig = await Gig.findByIdAndUpdate(existing._id, { status: "archived" }, { returnDocument: "after" })
      .populate("ownerId", "name email phone profileImage isVerified");

    return jsonOk({ ok: true, item: normalizeGig(gig) });
  } catch (error) {
    return jsonError(error);
  }
}
