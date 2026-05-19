import AITool from "@/models/AITool";
import { aiToolSchema } from "@/lib/mongo-validations";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo, requireRole, uniqueSlugFor } from "@/lib/mongo-api";
import { normalizeAITool, slugify } from "@/lib/platform-db";

export async function GET(_: Request, context: { params: Promise<{ toolId: string }> }) {
  try {
    await requireMongo();
    const { toolId } = await context.params;
    const tool = await AITool.findOne(mongoIdOrSlug(toolId)).lean();

    if (!tool) return jsonOk({ error: "AI tool not found." }, 404);

    return jsonOk(normalizeAITool(tool));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ toolId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);

    const { toolId } = await context.params;
    const existing = await AITool.findOne(mongoIdOrSlug(toolId));
    if (!existing) return jsonOk({ error: "AI tool not found." }, 404);

    const body = aiToolSchema.partial().parse(await readJson(request));
    const patch = { ...body };
    if (body.slug || body.name) {
      patch.slug = await uniqueSlugFor(AITool, body.slug ?? slugify(body.name), existing._id);
    }

    const tool = await AITool.findByIdAndUpdate(existing._id, patch, { returnDocument: "after", runValidators: true });

    return jsonOk(normalizeAITool(tool));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ toolId: string }> }) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);

    const { toolId } = await context.params;
    const tool = await AITool.findOneAndUpdate(mongoIdOrSlug(toolId), { status: "archived" }, { returnDocument: "after" });

    if (!tool) return jsonOk({ error: "AI tool not found." }, 404);

    return jsonOk({ ok: true, item: normalizeAITool(tool) });
  } catch (error) {
    return jsonError(error);
  }
}
