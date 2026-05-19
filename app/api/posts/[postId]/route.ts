import BlogPost from "@/models/BlogPost";
import { blogPostSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeBlogPost, slugify } from "@/lib/platform-db";

const blogPatchSchema = blogPostSchema.partial();

export async function GET(_: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    await requireMongo();
    const { postId } = await context.params;
    const post = await BlogPost.findOne({ ...mongoIdOrSlug(postId), deletedAt: { $exists: false } }).lean();

    if (!post) return jsonOk({ error: "Blog post not found." }, 404);

    return jsonOk(normalizeBlogPost(post));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);
    const { postId } = await context.params;
    const existing = await BlogPost.findOne({ ...mongoIdOrSlug(postId), deletedAt: { $exists: false } });

    if (!existing) return jsonOk({ error: "Blog post not found." }, 404);

    const body = blogPatchSchema.parse(await readJson(request));
    const patch: Record<string, unknown> = { ...body };

    if (body.slug || body.title) {
      patch.slug = await uniqueSlugFor(BlogPost, body.slug ?? slugify(body.title), existing._id);
    }

    if (body.categoryName && !body.categorySlug) {
      patch.categorySlug = slugify(body.categoryName);
    }

    if (body.published && !existing.publishedAt) {
      patch.publishedAt = new Date();
    }

    const post = await BlogPost.findByIdAndUpdate(existing._id, patch, {
      returnDocument: "after",
      runValidators: true
    });

    return jsonOk(normalizeBlogPost(post));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);
    const { postId } = await context.params;
    const post = await BlogPost.findOneAndUpdate(
      { ...mongoIdOrSlug(postId), deletedAt: { $exists: false } },
      { deletedAt: new Date(), published: false },
      { returnDocument: "after" }
    );

    if (!post) return jsonOk({ error: "Blog post not found." }, 404);

    return jsonOk({ ok: true, item: normalizeBlogPost(post) });
  } catch (error) {
    return jsonError(error);
  }
}
