import "server-only";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { env } from "@/lib/env";

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1)
    })
  )
});

const quizQuestionSchema = z.object({
  question: z.string().min(8),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(8)
});

const quizGenerationSchema = z.object({
  title: z.string().min(3),
  questions: z.array(quizQuestionSchema).min(3).max(12)
});

export const geminiModel = env("GEMINI_MODEL", "gemini-2.5-flash-lite");
export const hasGeminiKey = Boolean(env("GOOGLE_GENERATIVE_AI_API_KEY") || env("GEMINI_API_KEY"));

function gemini(model = geminiModel) {
  if (env("GEMINI_API_KEY") && !env("GOOGLE_GENERATIVE_AI_API_KEY")) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = env("GEMINI_API_KEY");
  }

  return google(model);
}

function fallbackQuizQuestions(topic: string, seeds: string[], count: number) {
  const source = seeds.length ? seeds : ["core concept", "practical workflow", "final outcome"];

  return Array.from({ length: count }, (_, index) => {
    const seed = source[index % source.length];

    return {
      question: `Which action best demonstrates "${seed}" in ${topic}?`,
      options: [
        `Apply ${seed.toLowerCase()} in a practical project`,
        "Skip the activity and request a certificate",
        "Memorize only the lesson title",
        "Disable progress tracking"
      ],
      correctIndex: 0,
      explanation: `The correct answer proves the learner can apply ${seed.toLowerCase()} in context.`
    };
  });
}

export async function generateRecommendations(prompt: string) {
  if (!hasGeminiKey) {
    return {
      recommendations: [
        {
          title: "Creator Commerce Foundations",
          reason: "Fallback recommendation until the MrCreativist.AI provider key is configured.",
          confidence: 0.72
        }
      ]
    };
  }

  const result = await generateObject({
    model: gemini(),
    schema: recommendationSchema,
    prompt
  });

  return result.object;
}

export async function generateQuizQuestions(input: {
  courseTitle: string;
  chapterTitle?: string;
  outcomes?: string[];
  lessons?: string[];
  kind?: "quiz" | "test";
  count?: number;
  language?: string;
}) {
  const count = Math.min(12, Math.max(3, Number(input.count ?? (input.kind === "test" ? 8 : 5))));
  const seeds = [...(input.outcomes ?? []), ...(input.lessons ?? []), input.chapterTitle ?? ""].filter(Boolean);
  const topic = input.chapterTitle ? `${input.courseTitle}: ${input.chapterTitle}` : input.courseTitle;

  if (!hasGeminiKey) {
    return {
      title: `${input.courseTitle} ${input.kind === "test" ? "final test" : "chapter quiz"}`,
      questions: fallbackQuizQuestions(topic, seeds, count)
    };
  }

  const result = await generateObject({
    model: gemini(),
    schema: quizGenerationSchema,
    system:
      "You create high-quality e-learning multiple-choice assessments. Return only valid structured data. Every question must have exactly four options and one correctIndex.",
    prompt: [
      `Course: ${input.courseTitle}`,
      input.chapterTitle ? `Chapter: ${input.chapterTitle}` : "",
      `Assessment type: ${input.kind ?? "quiz"}`,
      `Question count: ${count}`,
      `Language: ${input.language ?? "English"}`,
      `Learning outcomes: ${(input.outcomes ?? []).join("; ") || "Practical course mastery"}`,
      `Lesson titles: ${(input.lessons ?? []).join("; ") || "Use the course topic"}`,
      "Make questions practical, fair, and directly tied to the course material."
    ]
      .filter(Boolean)
      .join("\n")
  });

  return result.object;
}
