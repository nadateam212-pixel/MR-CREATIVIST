import mongoose from "mongoose";

const WorkspaceActivitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true, maxlength: 120 },
    actorEmail: { type: String, lowercase: true, trim: true },
    note: { type: String, trim: true, maxlength: 500 },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const WorkspaceRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, trim: true, index: true },
    pathname: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 1000 },
    kind: { type: String, trim: true, default: "workflow", index: true },
    status: {
      type: String,
      enum: ["draft", "active", "needs_review", "approved", "completed", "archived"],
      default: "active",
      index: true
    },
    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    tags: [{ type: String, trim: true }],
    activity: { type: [WorkspaceActivitySchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

WorkspaceRecordSchema.index({ userEmail: 1, pathname: 1, updatedAt: -1 });

export default mongoose.models.WorkspaceRecord ||
  mongoose.model("WorkspaceRecord", WorkspaceRecordSchema);
