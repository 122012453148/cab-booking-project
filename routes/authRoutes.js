import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";



const router = express.Router();

/* ---------------- REGISTER ---------------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
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
