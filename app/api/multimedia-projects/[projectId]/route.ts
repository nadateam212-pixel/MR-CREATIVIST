import MultimediaProject from "@/models/MultimediaProject";
import { multimediaProjectSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { slugify } from "@/lib/platform-db";

export async function GET(_: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    await requireMongo();
    const { projectId } = await context.params;
    const project = await MultimediaProject.findOne(mongoIdOrSlug(projectId)).lean();

    if (!project) return jsonOk({ error: "Project not found." }, 404);

    return jsonOk(project);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin", "freelancer", "seller"]);

    const { projectId } = await context.params;
    const existing = await MultimediaProject.findOne(mongoIdOrSlug(projectId));
    if (!existing) return jsonOk({ error: "Project not found." }, 404);

    const body = multimediaProjectSchema.partial().parse(await readJson(request));
    const patch = { ...body };
    if (body.slug || body.title) {
      patch.slug = await uniqueSlugFor(MultimediaProject, body.slug ?? slugify(body.title), existing._id);
    }

    const project = await MultimediaProject.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true });

    return jsonOk(project);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    await requireMongo();
    const session = await requireRole(request, ["admin", "freelancer", "seller"]);

    const { projectId } = await context.params;
    if (session.user.role === "admin" && new URL(request.url).searchParams.get("hard") === "1") {
      const deleted = await MultimediaProject.findOneAndDelete(mongoIdOrSlug(projectId));
      if (!deleted) return jsonOk({ error: "Project not found." }, 404);

      return jsonOk({ ok: true, deleted: true });
    }

    const project = await MultimediaProject.findOneAndUpdate(mongoIdOrSlug(projectId), { status: "archived" }, { returnDocument: "after" });

    if (!project) return jsonOk({ error: "Project not found." }, 404);

    return jsonOk({ ok: true, item: project });
  } catch (error) {
    return jsonError(error);
  }
}
