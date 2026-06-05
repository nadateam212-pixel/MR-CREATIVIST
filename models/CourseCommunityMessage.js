import mongoose from "mongoose";

const CourseCommunityMessageSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    courseSlug: { type: String, required: true, trim: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseCommunityMessage", index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderName: { type: String, required: true, trim: true, maxlength: 120 },
    senderEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    senderRole: { type: String, trim: true, maxlength: 40 },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likeCount: { type: Number, min: 0, default: 0 },
    isInstructor: { type: Boolean, default: false, index: true },
    isPinned: { type: Boolean, default: false },
    deletedAt: Date
  },
  { timestamps: true }
);

CourseCommunityMessageSchema.index({ courseId: 1, createdAt: -1 });
CourseCommunityMessageSchema.index({ courseSlug: 1, createdAt: -1 });
CourseCommunityMessageSchema.index({ courseId: 1, parentId: 1, createdAt: 1 });

export default mongoose.models.CourseCommunityMessage ||
  mongoose.model("CourseCommunityMessage", CourseCommunityMessageSchema);
