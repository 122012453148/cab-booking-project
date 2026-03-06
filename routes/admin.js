import express from "express";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import Booking from "../models/Booking.js";
import Cab from "../models/Cab.js";

const router = express.Router();

/* DASHBOARD STATS */
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const totalRides = await Booking.countDocuments();

    const revenueData = await Booking.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    const recentRides = await Booking.find()
      .populate("userId", "name email")
      .populate("driverId", "name phone")
      .sort({ createdAt: -1 })
      .limit(5);

    // 🔥 Get Daily Stats for Chart (Last 7 Days)
    const chartDataMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartDataMap[dateStr] = { _id: dateStr, revenue: 0, rides: 0 };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const rawChartData = await Booking.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: "COMPLETED" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          rides: { $sum: 1 }
        }
      }
    ]);

    // Merge raw data into our map
    rawChartData.forEach(item => {
      if (chartDataMap[item._id]) {
        chartDataMap[item._id] = item;
      }
    });

    // Convert map to sorted array
    const chartData = Object.values(chartDataMap).sort((a, b) => a._id.localeCompare(b._id));

    res.json({
      totalUsers,
      totalDrivers,
      totalRides,
      totalRevenue,
      recentRides,
      chartData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* USERS LIST WITH BOOKING COUNTS */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().lean();
    
    // For each user, get their bookings
    const usersWithBookings = await Promise.all(
      users.map(async (user) => {
        const bookings = await Booking.find({ userId: user._id }).sort({ createdAt: -1 });
        return {
          ...user,
          bookingCount: bookings.length,
          bookings: bookings
        };
      })
    );

    res.json(usersWithBookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DRIVERS LIST */
router.get("/drivers", async (req, res) => {
  try {
    const drivers = await Driver.find().lean();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ALL BOOKINGS */
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name phone")
      .populate("driverId", "name phone")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* EARNINGS STATS */
router.get("/earnings", async (req, res) => {
  try {
    const earnings = await Booking.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    res.json(earnings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* VEHICLE TYPES */
router.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Cab.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* REPORTS / SYSTEM OVERVIEW */
router.get("/reports", async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const completed = await Booking.countDocuments({ status: "COMPLETED" });
    const booked = await Booking.countDocuments({ status: "BOOKED" });
    const assigned = await Booking.countDocuments({ status: "ASSIGNED" });
    const ontrip = await Booking.countDocuments({ status: "ON_TRIP" });

    res.json({
      totalBookings,
      statusCounts: {
        COMPLETED: completed,
        BOOKED: booked,
        ASSIGNED: assigned,
        ON_TRIP: ontrip
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
