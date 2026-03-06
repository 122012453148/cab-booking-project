import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    password: String,

  profileImage: String,
carNumber: String,
licenseNumber: String,
rcNumber: String,
totalRides: { type: Number, default: 0 },
totalEarnings: { type: Number, default: 0 }

  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);
