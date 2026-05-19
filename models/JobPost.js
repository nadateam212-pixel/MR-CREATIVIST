import mongoose from "mongoose";

const JobPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    companyName: { type: String, required: true, trim: true, maxlength: 160 },
    companyLogo: { type: String, default: "" },
    location: { type: String, required: true, trim: true, maxlength: 180 },
    workplaceType: { type: String, enum: ["Remote", "Hybrid", "On-site"], default: "Remote" },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      default: "Full-time"
    },
    salaryMin: { type: Number, min: 0, default: 0 },
    salaryMax: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    category: { type: String, required: true, trim: true, maxlength: 120, index: true },
    description: { type: String, required: true, trim: true, maxlength: 8000 },
    responsibilities: [{ type: String, trim: true, maxlength: 240 }],
    requirements: [{ type: String, trim: true, maxlength: 240 }],
    benefits: [{ type: String, trim: true, maxlength: 180 }],
    skills: [{ type: String, trim: true, maxlength: 100 }],
    applyUrl: { type: String, default: "" },
    contactEmail: { type: String, lowercase: true, trim: true },
    applicationDeadline: Date,
    postedById: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    postedByName: { type: String, trim: true, maxlength: 120 },
    status: { type: String, enum: ["draft", "published", "closed", "archived"], default: "draft", index: true },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

JobPostSchema.index({ title: "text", companyName: "text", category: "text", skills: "text" });

export default mongoose.models.JobPost || mongoose.model("JobPost", JobPostSchema);
