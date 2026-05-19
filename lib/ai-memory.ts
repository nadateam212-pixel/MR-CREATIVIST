import "server-only";
import mongoose from "mongoose";
import { auth } from "@/auth";
import connectMongoDB, { hasMongoConfig, isMongoConnectionError } from "@/lib/mongodb";
import AIConversation from "@/models/AIConversation";

type AIMemoryInput = {
  toolId: string;
  userContent: string;
  conversationId?: string;
  clientId?: string;
};

type AIMemorySession = {
  conversationId: string;
  memoryContext: string;
  save: (assistantContent: unknown, metadata?: Record<string, unknown>) => Promise<void>;
};

function trimContent(value: unknown, limit = 6000) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return text.replace(/\s+$/g, "").slice(0, limit);
}

function toMemoryContext(messages: { role: string; content: string; toolId?: string }[]) {
  if (!messages.length) return "";

  const lines = messages.slice(-12).map((message) => {
    const role = message.role === "assistant" ? "MrCreativist.AI" : "User";
    const tool = message.toolId ? ` (${message.toolId})` : "";

    return `${role}${tool}: ${trimContent(message.content, 900)}`;
  });

  return [
    "Previous conversation context for continuity:",
    ...lines,
    "Use this context only when it helps the current request. Do not invent missing facts."
  ].join("\n");
}

async function getConversation({
  conversationId,
  clientId,
  userId,
  userContent,
  toolId
}: AIMemoryInput & { userId?: string }) {
  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    const existing = await AIConversation.findById(conversationId);
    if (existing) return existing;
  }

  const identityFilter = userId ? { userId } : clientId ? { clientId } : null;

  if (identityFilter) {
    const existing = await AIConversation.findOne(identityFilter).sort({ lastUsedAt: -1 });
    if (existing) return existing;
  }

  return AIConversation.create({
    userId,
    clientId,
    title: trimContent(userContent, 90) || "MrCreativist.AI conversation",
    lastToolId: toolId,
    messages: []
  });
}

export async function prepareAIMemory(input: AIMemoryInput): Promise<AIMemorySession> {
  const fallbackConversationId = input.conversationId || input.clientId || crypto.randomUUID();

  if (!hasMongoConfig()) {
    return {
      conversationId: fallbackConversationId,
      memoryContext: "",
      save: async () => undefined
    };
  }

  try {
    const session = await auth();
    await connectMongoDB();
    const userId = session?.user?.id ? String(session.user.id) : undefined;
    const conversation = await getConversation({ ...input, userId });
    const memoryContext = toMemoryContext(conversation.messages ?? []);

    return {
      conversationId: String(conversation._id),
      memoryContext,
      save: async (assistantContent, metadata = {}) => {
        await AIConversation.findByIdAndUpdate(conversation._id, {
          $set: {
            lastToolId: input.toolId,
            lastUsedAt: new Date()
          },
          $push: {
            messages: {
              $each: [
                {
                  role: "user",
                  toolId: input.toolId,
                  content: trimContent(input.userContent),
                  metadata
                },
                {
                  role: "assistant",
                  toolId: input.toolId,
                  content: trimContent(assistantContent),
                  metadata
                }
              ],
              $slice: -40
            }
          }
        });
      }
    };
  } catch (error) {
    if (!isMongoConnectionError(error)) {
      console.warn("MrCreativist.AI memory unavailable:", error);
    }

    return {
      conversationId: fallbackConversationId,
      memoryContext: "",
      save: async () => undefined
    };
  }
}

export function withAIMemoryPrompt(prompt: string, memoryContext?: string) {
  if (!memoryContext) return prompt;

  return `${memoryContext}\n\nCurrent request:\n${prompt}`;
}
