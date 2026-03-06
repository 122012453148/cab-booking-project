import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pickup: String,
    drop: String,
    cabType: String,
    pricePerKm: Number,
    distance: Number,
    amount: Number,
    eta: Number,
    otp: String,
    customerName: String,
    customerPhone: String,
    expiresAt: Date,

    // 🔥 IMPORTANT – driver fields MUST exist
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    driverName: String,
    driverPhone: String,

    status: {
      type: String,
      default: "BOOKED",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
