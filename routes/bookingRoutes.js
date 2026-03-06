import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
const router = express.Router();

/* Create Booking WITH OTP */
router.post("/", async (req, res) => {
  try {
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

    const user = await User.findById(userId);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const booking = await Booking.create({
      pickup,
      drop,
      amount,
      cabType,
      distance,
      eta,
      pricePerKm,
      status,
      otp,
      userId: user._id,
      customerName: user.name,
      customerPhone: user.phone,
      status: "BOOKED",
      expiresAt: new Date(Date.now() + 60000), // 1 minute expiry
    });

    // 🔥 EMIT FULL BOOKING TO DRIVERS
    const io = req.app.get("io");
    io.emit("new_ride_available", booking);

    res.status(201).json(booking);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Booking failed" });
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
