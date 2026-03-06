import mongoose from "mongoose";

const cabSchema = new mongoose.Schema({
  type: String,
  baseFare: Number,
  perKmRate: Number,
  capacity: Number,
  isActive: { type: Boolean, default: true }
});

export default mongoose.model("Cab", cabSchema);
