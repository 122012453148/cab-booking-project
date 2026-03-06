import express from "express";
import Driver from "../models/Driver.js";
import bcrypt from "bcryptjs";
import Booking from "../models/Booking.js";

const router = express.Router();

/* ---------------- SIGNUP ---------------- */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await Driver.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Driver already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = await Driver.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ---------------- LOGIN ---------------- */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const driver = await Driver.findOne({ phone });
    if (!driver) {
      return res.status(400).json({ message: "Driver not found" });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

/* ---------------- UPDATE BASIC DRIVER ---------------- */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Error updating driver" });
  }
});

/* ---------------- UPDATE PROFILE ---------------- */
router.put("/:id/profile", async (req, res) => {
  try {
    const { carNumber, licenseNumber, rcNumber, profileImage } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { carNumber, licenseNumber, rcNumber, profileImage },
      { new: true }
    );

    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: "Profile update failed" });
  }
});

/* ---------------- GET DRIVER ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    res.json(driver);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- DRIVER ORDERS SUMMARY ---------------- */
router.get("/:id/orders", async (req, res) => {
  try {
    const driverId = req.params.id;

    const rides = await Booking.find({
      driverId,
      status: "COMPLETED"
    });

    const totalRides = rides.length;

    const totalEarnings = rides.reduce((sum, ride) => {
      return sum + ride.amount;
    }, 0);

    res.json({
      totalRides,
      totalEarnings,
      rides
    });

  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

export default router;
