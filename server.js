import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Driver from "./models/Driver.js";
import Booking from "./models/Booking.js";
import authRoutes from "./routes/authRoutes.js";
import cabRoutes from "./routes/cabRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import distanceRoutes from "./routes/distanceRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import adminRoutes from "./routes/admin.js";





dotenv.config();

const app = express();
const server = http.createServer(app);


/* ================= SOCKET SETUP ================= */
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

let onlineDrivers = {};

io.on("connection", (socket) => {

  console.log("🔌 New client connected:", socket.id);

  socket.on("newBooking", (booking) => {
    io.emit("new_ride_available", booking);
  });

  socket.on("driverOnline", (driverId) => {
    onlineDrivers[driverId] = socket.id;
  });

socket.on("acceptRide", async ({ bookingId, driverId }) => {
  try {
    console.log("🔥 ACCEPT EVENT HIT");

    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.log("Driver not found");
      return;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: "ASSIGNED",
        driverId: driver._id,
        driverName: driver.name,
        driverPhone: driver.phone,
      },
      { new: true }
    );

    console.log("✅ Updated Booking:", updatedBooking);

    io.emit("rideAccepted", updatedBooking);

  } catch (err) {
    console.log("Accept Ride Error:", err);
  }
});




  socket.on("verifyOtp", ({ bookingId }) => {
    io.emit("rideStarted", bookingId);
  });

  socket.on("driverLocation", (data) => {
    io.emit("updateDriverLocation", data);
  });

  socket.on("completeRide", (bookingId) => {
    io.emit("rideCompleted", bookingId);
  });

  socket.on("disconnect", () => {
    for (let driverId in onlineDrivers) {
      if (onlineDrivers[driverId] === socket.id) {
        delete onlineDrivers[driverId];
      }
    }
  });

});

/* ================= MIDDLEWARE ================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://weeflycab.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/cabs", cabRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/distance", distanceRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/admin", adminRoutes);

/* ================= DB ================= */
const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error("❌ CRITICAL ERROR: MONGO_URI is not defined in environment variables!");
  console.error("Please add MONGO_URI to your Render Environment settings.");
} else {
  console.log("📡 Attempting to connect to MongoDB...");
}

mongoose.connect(dbURI || "mongodb://127.0.0.1:27017/cab_booking")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error details:");
    console.error(err);
  });

mongoose.connection.once("open", () => {
  console.log("✅ MongoDB connected");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
