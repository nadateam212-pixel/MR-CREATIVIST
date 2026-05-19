import mongoose from "mongoose";

const AIConversationMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    toolId: { type: String, trim: true, maxlength: 80 },
    content: { type: String, required: true, maxlength: 12000 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const AIConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    clientId: { type: String, trim: true, maxlength: 120, index: true },
    title: { type: String, trim: true, maxlength: 180, default: "MrCreativist.AI conversation" },
    messages: { type: [AIConversationMessageSchema], default: [] },
    lastToolId: { type: String, trim: true, maxlength: 80 },
    lastUsedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

AIConversationSchema.index({ userId: 1, updatedAt: -1 });
AIConversationSchema.index({ clientId: 1, updatedAt: -1 });

export default mongoose.models.AIConversation || mongoose.model("AIConversation", AIConversationSchema);
