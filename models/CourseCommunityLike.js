import mongoose from "mongoose";

const CourseCommunityLikeSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseCommunityMessage", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, lowercase: true, trim: true, index: true }
  },
  { timestamps: true }
);

CourseCommunityLikeSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export default mongoose.models.CourseCommunityLike ||
  mongoose.model("CourseCommunityLike", CourseCommunityLikeSchema);
