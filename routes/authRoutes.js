import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";



const router = express.Router();

/* ---------------- REGISTER ---------------- */
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Registration attempt for:", req.body?.email);
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields (name, email, or password)" });
    }

    // Check if DB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ Database not connected. State:", mongoose.connection.readyState);
      return res.status(500).json({ 
        message: "Database connection is not ready", 
        state: mongoose.connection.readyState 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    console.log("✅ User created successfully:", user.email);
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("🔥 Registration Crash:", err);
    res.status(500).json({ 
      message: "Registration crashed on server", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* ---------------- LOGIN ---------------- */


router.post("/login", async (req, res) => {
  console.log("LOGIN DATA:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

  // 🔥 CREATE TOKEN
  const token = jwt.sign(
    { id: user._id },
    "secretkey",   // later move to .env
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login successful",
    token,
    user
  });
});



export default router;
