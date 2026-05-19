import mongoose from "mongoose";

const accountRoles = ["instructor", "seller", "freelancer", "consultant"];

const ApplicationDocumentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 160 },
    fileName: { type: String, trim: true, maxlength: 220 },
    url: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["identity", "credential", "portfolio", "business", "policy", "other"], default: "other" },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadAsset" },
    description: { type: String, trim: true, maxlength: 500 },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const AccountApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicantName: { type: String, required: true, trim: true, maxlength: 120 },
    applicantEmail: { type: String, required: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    requestedRole: { type: String, enum: accountRoles, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs_more_info"],
      default: "pending",
      index: true
    },
    professionalTitle: { type: String, required: true, trim: true, maxlength: 160 },
    organization: { type: String, trim: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40 },
    website: { type: String, trim: true, maxlength: 240 },
    summary: { type: String, required: true, trim: true, minlength: 30, maxlength: 2500 },
    experienceYears: { type: Number, min: 0, max: 80, default: 0 },
    roleDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    documents: { type: [ApplicationDocumentSchema], default: [] },
    adminNotes: { type: String, trim: true, maxlength: 2000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date
  },
  { timestamps: true }
);

AccountApplicationSchema.index({ userId: 1, requestedRole: 1, status: 1 });

export default mongoose.models.AccountApplication ||
  mongoose.model("AccountApplication", AccountApplicationSchema);
