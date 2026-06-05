import JobPost from "@/models/JobPost";
import { jobPostSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeJobPost, slugify } from "@/lib/platform-db";
import { revalidatePublicContent } from "@/lib/public-revalidation";

const jobPatchSchema = jobPostSchema.partial();

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    await requireMongo();
    const { jobId } = await context.params;
    const job = await JobPost.findOne(mongoIdOrSlug(jobId)).lean();

    if (!job) return jsonOk({ error: "Job not found." }, 404);

    return jsonOk(normalizeJobPost(job));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);
    const { jobId } = await context.params;
    const existing = await JobPost.findOne(mongoIdOrSlug(jobId));

    if (!existing) return jsonOk({ error: "Job not found." }, 404);

    const body = jobPatchSchema.parse(await readJson(request));
    const patch: Record<string, unknown> = { ...body };

    if (body.slug || body.title) {
      patch.slug = await uniqueSlugFor(JobPost, body.slug ?? slugify(body.title), existing._id);
    }

    const job = await JobPost.findByIdAndUpdate(existing._id, patch, {
      returnDocument: "after",
      runValidators: true
    });
    revalidatePublicContent("job", existing.slug);
    revalidatePublicContent("job", job?.slug);

    return jsonOk(normalizeJobPost(job));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);
    const { jobId } = await context.params;
    const job = await JobPost.findOneAndUpdate(mongoIdOrSlug(jobId), { status: "archived" }, { returnDocument: "after" });

    if (!job) return jsonOk({ error: "Job not found." }, 404);
    revalidatePublicContent("job", job.slug);

    return jsonOk({ ok: true, item: normalizeJobPost(job) });
  } catch (error) {
    return jsonError(error);
  }
}
