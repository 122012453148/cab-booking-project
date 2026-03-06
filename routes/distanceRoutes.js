import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({
      message: "Origin and destination required",
    });
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: origin,
          destinations: destination,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const element = response.data?.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return res.status(400).json({
        message: "Invalid locations or Google error",
        googleStatus: element?.status,
      });
    }

    const distanceKm = element.distance.value / 1000;
    const durationMin = element.duration.value / 60;

    return res.json({
      distanceKm: Math.ceil(distanceKm),
      durationMin: Math.ceil(durationMin),
    });

  } catch (error) {
    console.error("Google API error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Distance API failed",
    });
  }
});

export default router;
