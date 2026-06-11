import mongoose from "mongoose";

const ReferralProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true, unique: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true, index: true },
    status: { type: String, enum: ["active", "review", "suspended"], default: "active", index: true },
    commissionRate: { type: Number, min: 0, max: 1, default: 0.05 },
    clicks: { type: Number, min: 0, default: 0 },
    conversions: { type: Number, min: 0, default: 0 },
    revenue: { type: Number, min: 0, default: 0 },
    unpaidCommission: { type: Number, min: 0, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.models.ReferralProfile ||
  mongoose.model("ReferralProfile", ReferralProfileSchema);
