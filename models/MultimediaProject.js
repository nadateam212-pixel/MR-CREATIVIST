import mongoose from "mongoose";

const MultimediaProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    type: { type: String, enum: ["video", "audio", "brand", "photo", "animation", "campaign", "showreel"], required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creatorName: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 4000 },
    coverImage: { type: String, required: true },
    mediaUrls: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video", "audio", "document"], required: true },
        thumbnail: String,
        caption: String
      }
    ],
    services: [{ type: String, maxlength: 140 }],
    likes: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true }
  },
  { timestamps: true }
);

export default mongoose.models.MultimediaProject || mongoose.model("MultimediaProject", MultimediaProjectSchema);
