import mongoose from "mongoose";

const LearningEventSchema = new mongoose.Schema(
  {
    lessonKey: { type: String, trim: true },
    lessonTitle: { type: String, trim: true },
    moduleTitle: { type: String, trim: true },
    action: {
      type: String,
      enum: [
      "viewed",
      "position",
      "played",
        "studied",
        "read",
        "watched",
        "completed",
        "quiz_passed",
        "quiz_failed",
        "assignment_submitted",
        "downloaded"
      ],
      default: "viewed"
    },
    seconds: { type: Number, min: 0, default: 0 },
    score: { type: Number, min: 0, max: 100 },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const LearningProgressSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    learnerName: { type: String, required: true, trim: true },
    learnerEmail: { type: String, required: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    completedLessonKeys: [{ type: String, trim: true }],
    currentLessonKey: { type: String, trim: true },
    lessonPositions: { type: Map, of: Number, default: {} },
    watchedSecondsByLesson: { type: Map, of: Number, default: {} },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    certificateIssuedAt: Date,
    events: [LearningEventSchema]
  },
  { timestamps: true }
);

LearningProgressSchema.index({ courseId: 1, learnerEmail: 1 }, { unique: true });

export default mongoose.models.LearningProgress || mongoose.model("LearningProgress", LearningProgressSchema);
