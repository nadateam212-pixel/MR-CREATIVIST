import mongoose from "mongoose";

const CertificateCredentialSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    learnerName: { type: String, required: true, trim: true, maxlength: 160 },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", index: true },
    courseSlug: { type: String, required: true, trim: true, index: true },
    courseTitle: { type: String, required: true, trim: true, maxlength: 180 },
    verificationCode: { type: String, required: true, uppercase: true, trim: true, unique: true, index: true },
    template: { type: String, default: "Professional", trim: true },
    status: { type: String, enum: ["issued", "revoked"], default: "issued", index: true },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

CertificateCredentialSchema.index({ userEmail: 1, courseSlug: 1 }, { unique: true });

export default mongoose.models.CertificateCredential ||
  mongoose.model("CertificateCredential", CertificateCredentialSchema);
