import { NextRequest, NextResponse } from "next/server";
import { generateAIText } from "@/lib/ai-generators";
import { prepareAIMemory } from "@/lib/ai-memory";
import { jsonError, readJson } from "@/lib/mongo-api";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(3).max(2000),
  conversationId: z.string().optional(),
  clientId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const memory = await prepareAIMemory({
      toolId: "text",
      userContent: body.prompt,
      conversationId: body.conversationId,
      clientId: body.clientId
    });
    const result = await generateAIText(body.prompt, undefined, memory.memoryContext);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await memory.save(result.text);

    return NextResponse.json({ 
      output: result.text,
      tokens: result.tokens,
      conversationId: memory.conversationId
    });
  } catch (error) {
    return jsonError(error);
  }
}
