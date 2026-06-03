import mongoose from "mongoose";

const GigSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ownerName: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    packageName: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    deliveryDays: { type: Number, min: 1, default: 5 },
    revisions: { type: Number, min: 0, default: 1 },
    ownerAddress: { type: String, trim: true },
    ownerCity: { type: String, trim: true },
    ownerCountry: { type: String, trim: true },
    image: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    deliverables: [{ type: String, trim: true }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    orders: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["draft", "submitted", "changes_requested", "approved", "published", "archived"],
      default: "draft",
      index: true
    },
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Gig || mongoose.model("Gig", GigSchema);
