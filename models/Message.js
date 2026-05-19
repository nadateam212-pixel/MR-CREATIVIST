import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationKey: { type: String, required: true, index: true },
    subject: { type: String, trim: true, maxlength: 180, default: "" },
    contextType: {
      type: String,
      enum: ["direct", "offer", "product", "shop", "business", "gig", "job", "course", "support", "consulting"],
      default: "direct",
      index: true
    },
    contextId: { type: String, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: [
      {
        label: { type: String, trim: true, maxlength: 120 },
        url: { type: String, trim: true, maxlength: 1000 }
      }
    ],
    readAt: Date
  },
  { timestamps: true }
);

MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ conversationKey: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
