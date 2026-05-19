import mongoose from "mongoose";

const AIToolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, maxlength: 1800 },
    category: { type: String, required: true, trim: true, index: true },
    icon: { type: String, default: "sparkles" },
    demoUrl: String,
    pricingPlan: { type: String, enum: ["free", "starter", "pro", "enterprise"], default: "starter" },
    apiAvailable: { type: Boolean, default: false },
    endpointKey: String,
    features: [{ type: String, maxlength: 140 }],
    usageCount: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true }
  },
  { timestamps: true }
);

export default mongoose.models.AITool || mongoose.model("AITool", AIToolSchema);
