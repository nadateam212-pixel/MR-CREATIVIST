import "server-only";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { google } from "@ai-sdk/google";
import { generateImage, generateObject, generateText } from "ai";
import { z } from "zod";
import { withAIMemoryPrompt } from "@/lib/ai-memory";

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const imageModel = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const imagenModel = process.env.GEMINI_IMAGEN_MODEL || "imagen-4.0-generate-001";

function ensureGeminiKey() {
  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);
}

function gemini(selectedModel = model) {
  ensureGeminiKey();
  return google(selectedModel);
}

function missingGeminiText() {
  return "MrCreativist.AI provider key is not configured. Please add the AI provider key to .env.local.";
}

function configuredGeminiKey() {
  ensureGeminiKey();
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
}

function parseImageSize(size: "1024x1024" | "1792x1024" | "1024x1792") {
  const [width, height] = size.split("x").map((value) => Number(value));

  return { width, height };
}

function aspectRatioFromSize(size: "1024x1024" | "1792x1024" | "1024x1792") {
  if (size === "1792x1024") return "16:9";
  if (size === "1024x1792") return "9:16";

  return "1:1";
}

let crcTable: number[] | null = null;

function getCrcTable() {
  if (crcTable) return crcTable;

  crcTable = Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
  });

  return crcTable;
}

function crc32(buffer: Buffer) {
  const table = getCrcTable();
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width: number, height: number, pixels: Buffer) {
  const header = Buffer.alloc(13);

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const scanlines = Buffer.alloc((width * 4 + 1) * height);

  for (let row = 0; row < height; row += 1) {
    const sourceStart = row * width * 4;
    const targetStart = row * (width * 4 + 1);

    scanlines[targetStart] = 0;
    pixels.copy(scanlines, targetStart + 1, sourceStart, sourceStart + width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND")
  ]);
}

function generatedRasterImage(prompt: string, size: "1024x1024" | "1792x1024" | "1024x1792") {
  const { width, height } = parseImageSize(size);
  const seed = createHash("sha256").update(prompt || "mr-creativist").digest();
  const pixels = Buffer.alloc(width * height * 4);
  const colors = [
    [20 + seed[0], 40 + seed[1] / 2, 120 + seed[2] / 2],
    [20 + seed[3] / 2, 120 + seed[4] / 2, 160 + seed[5] / 3],
    [120 + seed[6] / 2, 40 + seed[7] / 2, 180 + seed[8] / 3]
  ];
  const blobs = Array.from({ length: 5 }, (_, index) => ({
    x: (seed[9 + index * 3] / 255) * width,
    y: (seed[10 + index * 3] / 255) * height,
    radius: (0.22 + seed[11 + index * 3] / 900) * Math.min(width, height),
    color: colors[index % colors.length]
  }));

  for (let y = 0; y < height; y += 1) {
    const yRatio = y / Math.max(1, height - 1);
    for (let x = 0; x < width; x += 1) {
      const xRatio = x / Math.max(1, width - 1);
      let red = colors[0][0] * (1 - xRatio) + colors[1][0] * xRatio;
      let green = colors[0][1] * (1 - yRatio) + colors[1][1] * yRatio;
      let blue = colors[2][2] * (0.35 + xRatio * 0.45 + yRatio * 0.2);

      for (const blob of blobs) {
        const distance = Math.hypot(x - blob.x, y - blob.y);
        const influence = Math.max(0, 1 - distance / blob.radius) ** 2;
        red = red * (1 - influence) + blob.color[0] * influence;
        green = green * (1 - influence) + blob.color[1] * influence;
        blue = blue * (1 - influence) + blob.color[2] * influence;
      }

      const wave = Math.sin((x + seed[24]) / 42) * Math.cos((y + seed[25]) / 47) * 18;
      const grain = (((x * 13 + y * 17 + seed[26]) & 31) - 15) * 0.45;
      const index = (y * width + x) * 4;

      pixels[index] = Math.max(0, Math.min(255, red + wave + grain));
      pixels[index + 1] = Math.max(0, Math.min(255, green + wave / 2 + grain));
      pixels[index + 2] = Math.max(0, Math.min(255, blue - wave / 3 + grain));
      pixels[index + 3] = 255;
    }
  }

  return `data:image/png;base64,${encodePng(width, height, pixels).toString("base64")}`;
}

async function generateImagenImage(prompt: string, size: "1024x1024" | "1792x1024" | "1024x1792") {
  const key = configuredGeminiKey();
  if (!key) throw new Error(missingGeminiText());

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${imagenModel}:predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatioFromSize(size),
        imageSize: "1K"
      }
    })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Gemini Imagen generation failed.");
  }

  const image = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!image) throw new Error("Gemini Imagen did not return an image.");

  return `data:image/png;base64,${image}`;
}

function rasterFallback(prompt: string, size: "1024x1024" | "1792x1024" | "1024x1792", reason?: string) {
  return {
    url: generatedRasterImage(prompt, size),
    providerMetadata: { provider: "mr-creativist-raster-fallback", reason },
    warnings: reason ? [reason] : undefined
  };
}

// ============================================
// CHAT / TEXT GENERATION
// ============================================

export async function generateAIText(prompt: string, systemPrompt?: string, memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return {
      text: missingGeminiText(),
      error: true
    };
  }

  try {
    const result = await generateText({
      model: gemini(),
      system:
        systemPrompt ||
        "You are MrCreativist.AI, a professional assistant for learning, commerce, creative production, jobs, businesses and creator workflows. Continue the conversation naturally when previous context is provided.",
      prompt: withAIMemoryPrompt(prompt, memoryContext)
    });

    return { text: result.text, tokens: result.usage };
  } catch (error) {
    return {
      text: "",
      error: error instanceof Error ? error.message : "Generation failed"
    };
  }
}

// ============================================
// BLOG POST GENERATOR
// ============================================

const blogPostSchema = z.object({
  title: z.string(),
  introduction: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string()
    })
  ),
  conclusion: z.string(),
  seoKeywords: z.array(z.string())
});

export async function generateBlogPost(topic: string, keywords?: string[], memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return {
      error: missingGeminiText()
    };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: blogPostSchema,
      system: `You are a professional blog writer. Create high-quality, engaging blog posts with proper structure.
Always include:
- Compelling introduction
- 4-5 well-organized sections with headings
- Strong conclusion with call-to-action
- 5-8 relevant SEO keywords`,
      prompt: withAIMemoryPrompt(
        `Write a blog post about: ${topic}${keywords ? `\nTarget these keywords: ${keywords.join(", ")}` : ""}`,
        memoryContext
      )
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Blog generation failed"
    };
  }
}

// ============================================
// SOCIAL MEDIA CONTENT GENERATOR
// ============================================

const socialContentSchema = z.object({
  linkedin: z.string(),
  twitter: z.string(),
  instagram: z.string(),
  facebook: z.string(),
  tiktok: z.string()
});

export async function generateSocialMediaContent(topic: string, platform?: string, memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return { error: missingGeminiText() };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: socialContentSchema,
      system: `You are a social media expert. Create platform-specific content that's engaging and follows best practices.
- LinkedIn: Professional, 200-250 chars
- Twitter: 280 chars max, with #hashtags
- Instagram: Engaging caption with #hashtags
- Facebook: 500+ chars with story
- TikTok: Trending, fun, 100 chars max`,
      prompt: withAIMemoryPrompt(
        `Create social media content for: ${topic}${platform ? `\nPrioritize: ${platform}` : ""}`,
        memoryContext
      )
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Social content generation failed"
    };
  }
}

// ============================================
// IMAGE GENERATION
// ============================================

export async function generateAIImage(prompt: string, size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024") {
  if (!ensureGeminiKey()) {
    return rasterFallback(prompt, size, missingGeminiText());
  }

  try {
    const result = await generateImage({
      model: google.image(imageModel),
      prompt: `Create a polished, production-ready ${size} image for MR Creativist. Request: ${prompt}`,
      size
    });
    const imageFile = result.image;
    const mediaType = imageFile?.mediaType ?? "";

    if (!imageFile?.base64 || !mediaType.startsWith("image/") || mediaType === "image/svg+xml") {
      try {
        return {
          url: await generateImagenImage(prompt, size),
          revised_prompt: prompt,
          providerMetadata: { provider: imagenModel }
        };
      } catch (error) {
        return rasterFallback(
          prompt,
          size,
          error instanceof Error ? error.message : "Gemini image provider did not return a real image."
        );
      }
    }

    return {
      url: imageFile.base64.startsWith("data:")
        ? imageFile.base64
        : `data:${mediaType};base64,${imageFile.base64}`,
      revised_prompt: prompt,
      providerMetadata: result.providerMetadata,
      warnings: result.warnings
    };
  } catch (error) {
    try {
      return {
        url: await generateImagenImage(prompt, size),
        revised_prompt: prompt,
        providerMetadata: { provider: imagenModel }
      };
    } catch (fallbackError) {
      return rasterFallback(
        prompt,
        size,
        fallbackError instanceof Error
          ? fallbackError.message
          : error instanceof Error
            ? error.message
            : "MrCreativist.AI image generation failed"
      );
    }
  }
}

// ============================================
// CODE GENERATOR
// ============================================

const codeSchema = z.object({
  language: z.string(),
  code: z.string(),
  explanation: z.string(),
  usage: z.string()
});

export async function generateCode(description: string, language: string = "typescript", memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return { error: missingGeminiText() };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: codeSchema,
      system: `You are an expert ${language} developer. Generate clean, well-documented, production-ready code.
Include:
- Clear, readable code with proper formatting
- Helpful comments explaining logic
- Error handling where appropriate
- Usage examples`,
      prompt: withAIMemoryPrompt(`Generate ${language} code for: ${description}`, memoryContext)
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Code generation failed"
    };
  }
}

// ============================================
// COURSE OUTLINE GENERATOR
// ============================================

const courseOutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  level: z.string(),
  modules: z.array(
    z.object({
      title: z.string(),
      duration: z.string(),
      lessons: z.array(z.string())
    })
  ),
  learningOutcomes: z.array(z.string())
});

export async function generateCourseOutline(topic: string, level: string = "beginner", memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return { error: missingGeminiText() };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: courseOutlineSchema,
      system: `You are an expert course designer. Create comprehensive, structured course outlines.
Include:
- 4-6 well-organized modules
- 3-4 lessons per module
- Clear learning outcomes
- Realistic time estimates`,
      prompt: withAIMemoryPrompt(`Design a ${level} level course outline for: ${topic}`, memoryContext)
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Course generation failed"
    };
  }
}

// ============================================
// SEO OPTIMIZER
// ============================================

const seoSchema = z.object({
  optimizedTitle: z.string(),
  metaDescription: z.string(),
  keywords: z.array(z.string()),
  contentSuggestions: z.array(z.string()),
  headingStructure: z.array(z.string())
});

export async function generateSEOOptimization(content: string, targetKeywords?: string[], memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return { error: missingGeminiText() };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: seoSchema,
      system: `You are an SEO expert. Analyze content and provide optimization recommendations.
Focus on:
- Keyword optimization
- Meta tag recommendations
- Content structure for search engines
- Heading hierarchy`,
      prompt: withAIMemoryPrompt(
        `Optimize this content for SEO${targetKeywords ? ` with focus on: ${targetKeywords.join(", ")}` : ""}:\n\n${content}`,
        memoryContext
      )
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "SEO optimization failed"
    };
  }
}

// ============================================
// EMAIL TEMPLATE GENERATOR
// ============================================

const emailSchema = z.object({
  subject: z.string(),
  preheader: z.string(),
  body: z.string(),
  callToAction: z.string(),
  htmlPreview: z.string()
});

export async function generateEmailTemplate(purpose: string, brand?: string, memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return { error: missingGeminiText() };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: emailSchema,
      system: `You are an email marketing expert. Create professional, conversion-focused email templates.
Include:
- Compelling subject line
- Engaging preview text
- Clear, persuasive body
- Strong call-to-action
- HTML structure preview`,
      prompt: withAIMemoryPrompt(`Create an email template for: ${purpose}${brand ? `\nBrand: ${brand}` : ""}`, memoryContext)
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Email generation failed"
    };
  }
}

// ============================================
// PRODUCT DESCRIPTION GENERATOR
// ============================================

const productDescSchema = z.object({
  shortDescription: z.string(),
  longDescription: z.string(),
  bulletPoints: z.array(z.string()),
  benefits: z.array(z.string()),
  seoTitle: z.string(),
  metaDescription: z.string()
});

export async function generateProductDescription(productName: string, features: string[], memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return { error: missingGeminiText() };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: productDescSchema,
      system: `You are an expert copywriter for e-commerce. Create compelling product descriptions that sell.
Include:
- Concise short description
- Detailed long description
- Key features as bullet points
- Customer benefits
- SEO-optimized title and meta description`,
      prompt: withAIMemoryPrompt(`Write product description for: ${productName}\nKey features: ${features.join(", ")}`, memoryContext)
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Product description generation failed"
    };
  }
}

// ============================================
// VIDEO SCRIPT GENERATOR
// ============================================

const videoScriptSchema = z.object({
  title: z.string(),
  duration: z.string(),
  hookLine: z.string(),
  scenes: z.array(
    z.object({
      timestamp: z.string(),
      voiceover: z.string(),
      visuals: z.string()
    })
  ),
  callToAction: z.string()
});

export async function generateVideoScript(topic: string, videoLength: string = "60 seconds", memoryContext?: string) {
  if (!ensureGeminiKey()) {
    return { error: missingGeminiText() };
  }

  try {
    const result = await generateObject({
      model: gemini(),
      schema: videoScriptSchema,
      system: `You are a professional video scriptwriter. Create engaging, concise video scripts.
Include:
- Attention-grabbing hook
- Scene-by-scene breakdown with timestamps
- Clear voiceover copy
- Visual direction
- Strong call-to-action`,
      prompt: withAIMemoryPrompt(`Write a ${videoLength} video script for: ${topic}`, memoryContext)
    });

    return result.object;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Video script generation failed"
    };
  }
}
