import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
const router = express.Router();

/* Create Booking WITH OTP */
router.post("/", async (req, res) => {
  try {
    console.log("📥 Booking request received:", req.body);
    const {
      pickup,
      drop,
      amount,
      userId,
      cabType,
      distance,
      eta,
      pricePerKm,
      status
    } = req.body;

    if (!userId) {
      console.error("❌ Booking Error: No userId provided in request");
      return res.status(400).json({ message: "userId is required for booking" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error("❌ Booking Error: User not found with ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const bookingData = {
      pickup,
      drop,
      amount,
      cabType,
      distance,
      eta,
      pricePerKm,
      status: status || "BOOKED",
      otp,
      userId: user._id,
      customerName: user.name,
      customerPhone: user.phone,
      expiresAt: new Date(Date.now() + 60000), // 1 minute expiry
    };

    console.log("💾 Creating booking in DB with data:", bookingData);
    const booking = await Booking.create(bookingData);

    // 🔥 EMIT FULL BOOKING TO DRIVERS
    const io = req.app.get("io");
    if (io) {
      console.log("📡 Emitting new_ride_available event via Socket.io");
      io.emit("new_ride_available", booking);
    } else {
      console.warn("⚠️ Socket.io instance (io) not found in app settings");
    }

    console.log("✅ Booking successful:", booking._id);
    res.status(201).json(booking);

  } catch (err) {
    console.error("🔥 CRITICAL BOOKING ERROR:", err);
    res.status(500).json({ 
      message: "Booking failed", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});
router.put("/:id/start", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "ON_TRIP" },
      { new: true }
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("rideStarted", booking._id);
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Start trip failed" });
  }
});

router.put("/:id/complete", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "COMPLETED" },
      { new: true }
    );

    const io = req.app.get("io");
    io.emit("rideCompleted", booking._id);

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Complete failed" });
  }
});


/* Get Booking By ID */
/* Get Booking By ID */
/* Get Booking By ID */
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking)
      return res.status(404).json({ message: "Not found" });

    res.json(booking);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error" });
  }
});



router.get("/", async (req, res) => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const bookings = await Booking.find({
      status: "BOOKED",
      createdAt: { $gte: oneMinuteAgo }
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

router.get("/driver/:driverId", async (req, res) => {
  try {
    const rides = await Booking.find({
      driverId: req.params.driverId,
      status: "COMPLETED"
    });

    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rides" });
  }
});

/* Get All Bookings for a Customer (History) */
router.get("/user/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { userId: req.params.userId },
        { customerId: req.params.userId }
      ]
    }).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;
