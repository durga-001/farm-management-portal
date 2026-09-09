import express from "express";
import Farm from "../models/Farm.js";

const router = express.Router();

// Public: counts of registered farms grouped by location, for the landing page.
router.get("/registrations-by-location", async (req, res) => {
  const farms = await Farm.find().select("location");
  const counts = {};
  farms.forEach((f) => {
    const key = f.location || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  const result = Object.entries(counts).map(([location, count]) => ({ location, count })).sort((a, b) => b.count - a.count);
  res.json(result);
});

export default router;
