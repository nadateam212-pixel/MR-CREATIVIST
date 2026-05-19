import { NextRequest, NextResponse } from "next/server";
import { generateSEOOptimization } from "@/lib/ai-generators";
import { prepareAIMemory } from "@/lib/ai-memory";
import { jsonError, readJson } from "@/lib/mongo-api";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(10).max(5000),
  targetKeywords: z.array(z.string()).optional(),
  conversationId: z.string().optional(),
  clientId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const memory = await prepareAIMemory({
      toolId: "seo",
      userContent: `SEO content: ${body.content.slice(0, 1000)}`,
      conversationId: body.conversationId,
      clientId: body.clientId
    });
    const result = await generateSEOOptimization(body.content, body.targetKeywords, memory.memoryContext);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await memory.save(result);

    return NextResponse.json({ ...result, conversationId: memory.conversationId });
  } catch (error) {
    return jsonError(error);
  }
}
