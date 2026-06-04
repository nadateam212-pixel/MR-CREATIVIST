import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 800 },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const FreelancerProfileSchema = new mongoose.Schema(
  {
    studioId: { type: String, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    completedJobs: { type: Number, min: 0, default: 0 },
    responseHours: { type: Number, min: 0, default: 24 },
    availabilityPercent: { type: Number, min: 0, max: 100, default: 60 },
    portfolioScore: { type: Number, min: 0, max: 100, default: 80 },
    languages: [{ type: String, required: true }],
    skills: [{ type: String, required: true }],
    verifiedBadges: [{ type: String }],
    image: { type: String, required: true },
    bio: { type: String, maxlength: 2000 },
    gigs: [{ title: String, price: Number, deliveryDays: Number }],
    portfolio: [{ title: String, url: String, image: String }],
    reviews: [ReviewSchema],
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

export default mongoose.models.FreelancerProfile || mongoose.model("FreelancerProfile", FreelancerProfileSchema);
