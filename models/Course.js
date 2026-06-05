import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    type: { type: String, enum: ["video", "article", "image", "quiz", "assignment", "download"], default: "video" },
    sourceType: { type: String, enum: ["google-drive", "external-link", "upload", "text"], default: "google-drive" },
    durationMinutes: { type: Number, min: 0, default: 0 },
    durationSeconds: { type: Number, min: 0, default: 0 },
    summary: { type: String, trim: true, maxlength: 1200 },
    videoUrl: String,
    videoProvider: { type: String, trim: true },
    imageUrl: String,
    resources: [
      {
        label: String,
        title: String,
        type: String,
        url: String,
        accessRule: { type: String, enum: ["enrolled", "free"], default: "enrolled" },
        downloadable: { type: Boolean, default: true }
      }
    ],
    quizQuestions: [
      {
        id: { type: String, trim: true },
        question: { type: String, required: true, trim: true, maxlength: 500 },
        options: [{ type: String, trim: true, maxlength: 240 }],
        correctIndex: { type: Number, min: 0, default: 0 },
        explanation: { type: String, trim: true, maxlength: 700 }
      }
    ],
    isPreview: { type: Boolean, default: false },
    freePreview: { type: Boolean, default: false },
    previewStartSeconds: { type: Number, min: 0, default: 0 },
    previewEndSeconds: { type: Number, min: 0, default: 90 }
  },
  { _id: false }
);

const ModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, maxlength: 900 },
    orderIndex: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["draft", "ready", "hidden"], default: "draft" },
    lessons: [LessonSchema]
  },
  { _id: false }
);

const CourseResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    type: { type: String, trim: true, default: "PDF" },
    url: { type: String, required: true, trim: true },
    accessRule: { type: String, enum: ["enrolled", "free"], default: "enrolled" },
    attachLevel: { type: String, enum: ["course", "lesson"], default: "course" },
    downloadable: { type: Boolean, default: true },
    description: { type: String, maxlength: 800 }
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    shortDescription: { type: String, required: true, maxlength: 260 },
    description: { type: String, required: true, maxlength: 5000 },
    studioId: { type: String, trim: true, index: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    instructorName: { type: String, required: true, trim: true },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "All levels", "Expert"], default: "Beginner" },
    category: { type: String, required: true, trim: true, index: true },
    subcategory: { type: String, trim: true },
    language: { type: String, enum: ["Kinyarwanda", "English", "French", "Other"], default: "English" },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    image: { type: String, required: true },
    trailerUrl: String,
    previewType: { type: String, enum: ["smart", "custom", "none"], default: "smart" },
    defaultPreviewDuration: { type: Number, min: 0, default: 90 },
    previewApplyTo: { type: String, enum: ["first", "selected", "all"], default: "first" },
    paywallMessage: {
      type: String,
      trim: true,
      maxlength: 400,
      default: "This is a preview. Enroll now to continue watching the full lesson."
    },
    pricingType: { type: String, enum: ["free", "paid", "subscription", "manual"], default: "paid" },
    targetAudience: { type: String, maxlength: 1200 },
    duration: { type: String, default: "Self-paced" },
    lessonsCount: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    enrolledCount: { type: Number, min: 0, default: 0 },
    likes: { type: Number, min: 0, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shareCount: { type: Number, min: 0, default: 0 },
    commentCount: { type: Number, min: 0, default: 0 },
    replyCount: { type: Number, min: 0, default: 0 },
    certificate: { type: String, default: "Completion certificate" },
    outcomes: [{ type: String, maxlength: 180 }],
    tools: [{ type: String, maxlength: 120 }],
    tags: [{ type: String, lowercase: true, trim: true }],
    modules: [ModuleSchema],
    resources: [CourseResourceSchema],
    reviewNotes: { type: String, maxlength: 2000 },
    publishedAt: { type: Date },
    lastCompiledAt: { type: Date },
    publicationStatus: {
      type: String,
      enum: ["draft", "ready", "published", "needs_curriculum", "archived"],
      default: "draft",
      index: true
    },
    publicationIssues: [{ type: String, maxlength: 240 }],
    status: {
      type: String,
      enum: ["draft", "submitted", "changes_requested", "approved", "published", "unlisted", "archived"],
      default: "draft",
      index: true
    },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
