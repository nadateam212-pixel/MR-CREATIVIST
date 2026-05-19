import mongoose from "mongoose";

const roleValues = ["student", "instructor", "seller", "client", "freelancer", "consultant", "admin"];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: roleValues,
      default: "client",
      index: true
    },
    validatedRoles: {
      type: [{ type: String, enum: roleValues }],
      default: ["client"]
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "review"],
      default: "active",
      index: true
    },
    profileImage: { type: String, default: null },
    bio: { type: String, maxlength: 1200 },
    location: { type: String, maxlength: 160 },
    phone: { type: String, maxlength: 40 },
    socialLinks: {
      website: String,
      linkedin: String,
      youtube: String,
      instagram: String,
      x: String
    },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: Date
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
