import mongoose from "mongoose";

const WalletTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    counterpartyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    counterpartyEmail: { type: String, lowercase: true, trim: true },
    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "transfer_in",
        "transfer_out",
        "purchase",
        "refund",
        "course_earning",
        "product_earning",
        "consulting_earning",
        "freelance_earning",
        "referral_earning",
        "payout",
        "admin_payout",
        "admin_adjustment"
      ],
      required: true,
      index: true
    },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    status: { type: String, enum: ["pending", "completed", "failed", "cancelled"], default: "completed", index: true },
    balanceAfter: { type: Number, min: 0, default: 0 },
    description: { type: String, required: true, trim: true, maxlength: 280 },
    referenceType: {
      type: String,
      enum: ["manual", "order", "enrollment", "booking", "contract", "referral", "withdrawal", "transfer", "workspace", "intouchpay", "admin_payment"],
      default: "manual",
      index: true
    },
    referenceId: { type: String, trim: true, index: true },
    requestTransactionId: { type: String, trim: true, index: true },
    providerTransactionId: { type: String, trim: true, index: true },
    providerReference: { type: String, trim: true, index: true },
    mobilePhone: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ userEmail: 1, createdAt: -1 });
WalletTransactionSchema.index({ referenceType: 1, requestTransactionId: 1 });
WalletTransactionSchema.index(
  { userEmail: 1, type: 1, referenceType: 1, referenceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referenceId: { $type: "string" },
      referenceType: { $ne: "manual" }
    }
  }
);

export default mongoose.models.WalletTransaction ||
  mongoose.model("WalletTransaction", WalletTransactionSchema);
