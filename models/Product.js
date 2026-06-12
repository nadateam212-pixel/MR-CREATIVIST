import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    type: { type: String, enum: ["Digital", "Physical", "Template", "Download", "Software", "Creator assets", "Service"], required: true },
    description: { type: String, required: true, maxlength: 5000 },
    studioId: { type: String, trim: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sellerName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    images: [{ type: String, required: true }],
    category: { type: String, required: true, trim: true, index: true },
    location: { type: String, trim: true, maxlength: 180, default: "Kigali, Rwanda" },
    stock: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    downloads: { type: Number, min: 0, default: 0 },
    delivery: { type: String, required: true },
    tools: [{ type: String, maxlength: 120 }],
    tags: [{ type: String, lowercase: true, trim: true }],
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

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
