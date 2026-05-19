import { z } from "zod";
import AITool from "@/models/AITool";
import { generateAIText } from "@/lib/ai-generators";
import { prepareAIMemory } from "@/lib/ai-memory";
import { jsonError, jsonOk, mongoIdOrSlug, readJson, requireMongo } from "@/lib/mongo-api";

const demoSchema = z.object({
  toolId: z.string().min(1),
  prompt: z.string().min(4).max(1200),
  conversationId: z.string().optional(),
  clientId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    await requireMongo();
    const body = demoSchema.parse(await readJson(request));
    const tool = await AITool.findOneAndUpdate(mongoIdOrSlug(body.toolId), { $inc: { usageCount: 1 } }, { returnDocument: "after" });

    if (!tool) return jsonOk({ error: "AI tool not found." }, 404);

    const memory = await prepareAIMemory({
      toolId: tool.slug,
      userContent: body.prompt,
      conversationId: body.conversationId,
      clientId: body.clientId
    });
    const generated = await generateAIText(
      body.prompt,
      `You are MrCreativist.AI running the ${tool.name} tool. Produce a concise, useful result for this tool category: ${tool.category}.`,
      memory.memoryContext
    );

    if ("error" in generated) {
      return jsonOk({ error: generated.error }, 500);
    }

    await memory.save(generated.text, { tool: tool.name });

    return jsonOk({
      tool: tool.name,
      output: generated.text,
      usageCount: tool.usageCount,
      conversationId: memory.conversationId
    });
  } catch (error) {
    return jsonError(error);
  }
}
