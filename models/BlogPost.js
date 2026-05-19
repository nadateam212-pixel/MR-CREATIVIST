import mongoose from "mongoose";

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, maxlength: 240 },
    image: { type: String, trim: true },
    content: { type: String, required: true, minlength: 10 },
    published: { type: Boolean, default: false, index: true },
    publishedAt: Date,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, lowercase: true, trim: true },
    categoryName: { type: String, default: "Platform Updates", trim: true },
    categorySlug: { type: String, default: "platform-updates", lowercase: true, trim: true },
    deletedAt: Date
  },
  { timestamps: true }
);

export default mongoose.models.BlogPost || mongoose.model("BlogPost", BlogPostSchema);
