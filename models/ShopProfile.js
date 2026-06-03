import mongoose from "mongoose";

const ShopOfferSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    type: { type: String, enum: ["Product", "Service"], default: "Product" },
    description: { type: String, trim: true, maxlength: 1000 },
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const ShopProfileSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ownerName: { type: String, trim: true, maxlength: 120 },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    tagline: { type: String, trim: true, maxlength: 220 },
    description: { type: String, required: true, trim: true, maxlength: 6000 },
    category: { type: String, required: true, trim: true, maxlength: 120, index: true },
    logo: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    contactName: { type: String, trim: true, maxlength: 120 },
    contactEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 50 },
    whatsapp: { type: String, trim: true, maxlength: 50 },
    website: { type: String, default: "" },
    address: { type: String, trim: true, maxlength: 240 },
    city: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 120 },
    openingHours: { type: String, trim: true, maxlength: 240 },
    productsOrServices: { type: [ShopOfferSchema], default: [] },
    tags: [{ type: String, lowercase: true, trim: true, maxlength: 80 }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
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

ShopProfileSchema.index({ name: "text", category: "text", tags: "text", description: "text" });

export default mongoose.models.ShopProfile || mongoose.model("ShopProfile", ShopProfileSchema);
