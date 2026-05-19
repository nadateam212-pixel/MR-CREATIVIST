import { NextRequest, NextResponse } from "next/server";
import { generateCourseOutline } from "@/lib/ai-generators";
import { prepareAIMemory } from "@/lib/ai-memory";
import { jsonError, readJson } from "@/lib/mongo-api";
import { z } from "zod";

const schema = z.object({
  topic: z.string().min(3).max(500),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  conversationId: z.string().optional(),
  clientId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const memory = await prepareAIMemory({
      toolId: "course",
      userContent: `${body.level ?? "beginner"} course: ${body.topic}`,
      conversationId: body.conversationId,
      clientId: body.clientId
    });
    const result = await generateCourseOutline(body.topic, body.level, memory.memoryContext);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await memory.save(result);

    return NextResponse.json({ ...result, conversationId: memory.conversationId });
  } catch (error) {
    return jsonError(error);
  }
}
