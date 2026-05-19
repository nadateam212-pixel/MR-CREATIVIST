import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ConsultingService", required: true, index: true },
    clientName: { type: String, required: true, trim: true, minlength: 2 },
    clientEmail: { type: String, required: true, lowercase: true, trim: true, match: /.+@.+\..+/ },
    sessionType: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    notes: { type: String, maxlength: 2000 },
    status: { type: String, enum: ["requested", "confirmed", "completed", "cancelled"], default: "requested", index: true }
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
