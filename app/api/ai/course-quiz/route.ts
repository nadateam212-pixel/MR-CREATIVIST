import { z } from "zod";
import { auth } from "@/auth";
import { generateQuizQuestions, hasGeminiKey } from "@/lib/ai";
import { jsonError, jsonOk, readJson } from "@/lib/mongo-api";

const quizRequestSchema = z.object({
  courseTitle: z.string().min(2).max(180),
  chapterTitle: z.string().max(180).optional(),
  outcomes: z.array(z.string().max(220)).default([]),
  lessons: z.array(z.string().max(220)).default([]),
  kind: z.enum(["quiz", "test"]).default("quiz"),
  count: z.coerce.number().int().min(3).max(12).default(5),
  language: z.enum(["English", "Kinyarwanda", "Francais"]).default("English")
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return jsonOk({ error: "Authentication required." }, 401);

    const body = quizRequestSchema.parse(await readJson(request));
    const quiz = await generateQuizQuestions(body);

    return jsonOk({
      ...quiz,
      provider: hasGeminiKey ? "MrCreativist.AI" : "fallback"
    });
  } catch (error) {
    return jsonError(error);
  }
}
