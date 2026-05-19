import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    quantity: { type: Number, min: 1, required: true },
    unitPrice: { type: Number, min: 0, required: true }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    buyerName: { type: String, required: true, trim: true },
    buyerEmail: { type: String, required: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    items: [OrderItemSchema],
    subtotal: { type: Number, min: 0, required: true },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, required: true },
    currency: { type: String, enum: ["USD", "FRW"], default: "USD" },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ["pending", "paid", "fulfilled", "refunded", "cancelled"], default: "pending", index: true }
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
