import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { type: "Sedan", price: 12 },
    { type: "SUV", price: 16 },
    { type: "MUV", price: 20 }
  ]);
});

export default router;

