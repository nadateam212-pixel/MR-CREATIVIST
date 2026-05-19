import { NextRequest, NextResponse } from "next/server";
import { generateAIImage } from "@/lib/ai-generators";
import { jsonError, readJson } from "@/lib/mongo-api";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(3).max(1000),
  size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const result = await generateAIImage(body.prompt, body.size);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
