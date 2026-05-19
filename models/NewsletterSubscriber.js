import mongoose from "mongoose";

const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    name: { type: String, trim: true, maxlength: 120 },
    interests: [{ type: String, trim: true }],
    source: { type: String, default: "website" },
    status: { type: String, enum: ["active", "unsubscribed"], default: "active", index: true }
  },
  { timestamps: true }
);

export default mongoose.models.NewsletterSubscriber || mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
