import { NextRequest, NextResponse } from "next/server";
import { generateProductDescription } from "@/lib/ai-generators";
import { prepareAIMemory } from "@/lib/ai-memory";
import { jsonError, readJson } from "@/lib/mongo-api";
import { z } from "zod";

const schema = z.object({
  productName: z.string().min(2).max(500),
  features: z.array(z.string()).min(1),
  conversationId: z.string().optional(),
  clientId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const memory = await prepareAIMemory({
      toolId: "product",
      userContent: `${body.productName}: ${body.features.join(", ")}`,
      conversationId: body.conversationId,
      clientId: body.clientId
    });
    const result = await generateProductDescription(body.productName, body.features, memory.memoryContext);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await memory.save(result);

    return NextResponse.json({ ...result, conversationId: memory.conversationId });
  } catch (error) {
    return jsonError(error);
  }
}
