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
      default: ["client", "student", "instructor", "seller", "freelancer", "consultant"]
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "review"],
      default: "active",
      index: true
    },
    profileImage: { type: String, default: null },
    emailVerifiedAt: Date,
    firebaseUid: { type: String, trim: true, index: true },
    authProviders: {
      type: [{ type: String, enum: ["credentials", "google", "firebase"] }],
      default: ["credentials"]
    },
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
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    referredByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    referredByEmail: { type: String, lowercase: true, trim: true },
    referredByCode: { type: String, uppercase: true, trim: true },
    referredAt: Date,
    isVerified: { type: Boolean, default: false },
    lastLoginAt: Date
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
