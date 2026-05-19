import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    learnerName: { type: String, required: true, trim: true },
    learnerEmail: { type: String, required: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    paidAmount: { type: Number, min: 0, default: 0 },
    certificateIssuedAt: Date
  },
  { timestamps: true }
);

EnrollmentSchema.index({ courseId: 1, learnerEmail: 1 }, { unique: true });

export default mongoose.models.Enrollment || mongoose.model("Enrollment", EnrollmentSchema);
