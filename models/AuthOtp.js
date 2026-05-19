import mongoose from "mongoose";

const AuthOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["login", "register"], required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, min: 0, default: 0 },
    consumedAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

AuthOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthOtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export default mongoose.models.AuthOtp || mongoose.model("AuthOtp", AuthOtpSchema);
