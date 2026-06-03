import mongoose from "mongoose";

const ConsultingServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expertName: { type: String, required: true, trim: true },
    expertTitle: { type: String, required: true, trim: true },
    avatar: String,
    description: { type: String, required: true, maxlength: 4000 },
    hourlyRate: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    expertise: [{ type: String, required: true }],
    languages: [{ type: String, default: "English" }],
    sessionTypes: [
      {
        label: { type: String, required: true },
        durationMinutes: { type: Number, min: 15, default: 60 },
        price: { type: Number, min: 0 }
      }
    ],
    availability: [{ day: String, slots: [String] }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    heroImage: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "changes_requested", "approved", "published", "archived"],
      default: "draft",
      index: true
    },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.ConsultingService || mongoose.model("ConsultingService", ConsultingServiceSchema);
