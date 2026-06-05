import BlogPost from "@/models/BlogPost";
import { blogPostSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeBlogPost, slugify } from "@/lib/platform-db";
import { revalidatePublicContent } from "@/lib/public-revalidation";

export async function GET(request: Request) {
  try {
    await requireMongo();
    const { limit, skip, q } = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get("all") === "1";

    if (includeDrafts) {
      await requireRole(request, ["admin"]);
    }

    const filter: Record<string, unknown> = includeDrafts
      ? { deletedAt: { $exists: false } }
      : { published: true, deletedAt: { $exists: false } };

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ title: term }, { excerpt: term }, { content: term }, { categoryName: term }];
    }

    const [items, total] = await Promise.all([
      BlogPost.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter)
    ]);

    return jsonOk({ items: items.map(normalizeBlogPost), total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin"]);
    const body = blogPostSchema.parse(await readJson(request));
    const slug = await uniqueSlugFor(BlogPost, body.slug ?? slugify(body.title));
    const categorySlug = body.categorySlug ?? slugify(body.categoryName);
    const post = await BlogPost.create({
      ...body,
      slug,
      categorySlug,
      publishedAt: body.published ? new Date() : undefined,
      authorId: session.user.id,
      authorName: session.user.name ?? "MR Creativist Admin",
      authorEmail: session.user.email ?? "admin@mrcreativist.com"
    });
    revalidatePublicContent("blog", post.slug);

    return jsonOk(normalizeBlogPost(post), 201);
  } catch (error) {
    return jsonError(error);
  }
}
