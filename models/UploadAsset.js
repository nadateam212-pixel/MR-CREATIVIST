import mongoose from "mongoose";

const UploadAssetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true, trim: true, maxlength: 220 },
    url: { type: String, required: true, trim: true },
    secureUrl: { type: String, trim: true },
    playbackUrl: { type: String, trim: true },
    embedUrl: { type: String, trim: true },
    thumbnailUrl: { type: String, trim: true },
    provider: { type: String, enum: ["local", "cloudinary", "vimeo", "external"], default: "local", index: true },
    providerAssetId: { type: String, trim: true, index: true },
    kind: { type: String, enum: ["image", "video", "audio", "document", "archive", "other"], default: "other" },
    mimeType: { type: String, trim: true, maxlength: 120 },
    data: { type: String, select: false },
    sizeBytes: { type: Number, min: 0, default: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    durationSeconds: { type: Number, min: 0 },
    status: { type: String, enum: ["ready", "uploading", "processing", "failed"], default: "ready", index: true },
    ownerType: { type: String, enum: ["course", "product", "assignment", "project", "profile", "message", "general"], default: "general" },
    ownerId: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.models.UploadAsset || mongoose.model("UploadAsset", UploadAssetSchema);
