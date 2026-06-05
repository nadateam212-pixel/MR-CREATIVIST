import mongoose from "mongoose";

const CourseLikeSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    courseSlug: { type: String, required: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, lowercase: true, trim: true, index: true }
  },
  { timestamps: true }
);

CourseLikeSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export default mongoose.models.CourseLike || mongoose.model("CourseLike", CourseLikeSchema);
