import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    type: { type: String, enum: ["video", "article", "image", "quiz", "assignment", "download"], default: "video" },
    durationMinutes: { type: Number, min: 0, default: 0 },
    summary: { type: String, trim: true, maxlength: 1200 },
    videoUrl: String,
    imageUrl: String,
    resources: [{ label: String, url: String }],
    quizQuestions: [
      {
        id: { type: String, trim: true },
        question: { type: String, required: true, trim: true, maxlength: 500 },
        options: [{ type: String, trim: true, maxlength: 240 }],
        correctIndex: { type: Number, min: 0, default: 0 },
        explanation: { type: String, trim: true, maxlength: 700 }
      }
    ],
    isPreview: { type: Boolean, default: false }
  },
  { _id: false }
);

const ModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, maxlength: 900 },
    lessons: [LessonSchema]
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    shortDescription: { type: String, required: true, maxlength: 260 },
    description: { type: String, required: true, maxlength: 5000 },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    instructorName: { type: String, required: true, trim: true },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "All levels", "Expert"], default: "Beginner" },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    image: { type: String, required: true },
    trailerUrl: String,
    duration: { type: String, default: "Self-paced" },
    lessonsCount: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    enrolledCount: { type: Number, min: 0, default: 0 },
    certificate: { type: String, default: "Completion certificate" },
    outcomes: [{ type: String, maxlength: 180 }],
    tools: [{ type: String, maxlength: 120 }],
    tags: [{ type: String, lowercase: true, trim: true }],
    modules: [ModuleSchema],
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
