import mongoose from "mongoose";

const UserFcmTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["web"], default: "web" },
    userAgent: { type: String, trim: true, maxlength: 500 },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    disabledAt: Date
  },
  { timestamps: true }
);

UserFcmTokenSchema.index({ userId: 1, disabledAt: 1, lastSeenAt: -1 });

export default mongoose.models.UserFcmToken || mongoose.model("UserFcmToken", UserFcmTokenSchema);
