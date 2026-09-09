import express from "express";
import Farm from "../models/Farm.js";
import Veterinarian from "../models/Veterinarian.js";
import Animal from "../models/Animal.js";

const router = express.Router();

router.get("/public", async (req, res) => {
  const [totalFarms, totalVets, totalAnimals] = await Promise.all([
    Farm.countDocuments(),
    Veterinarian.countDocuments(),
    Animal.countDocuments(),
  ]);
  res.json({ totalFarms, totalVets, totalAnimals });
});

router.get("/registrations-by-location", async (req, res) => {
  const farms = await Farm.find().select("location");
  const counts = {};
  farms.forEach((f) => {
    const key = f.location || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  const result = Object.entries(counts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);
  res.json(result);
});

export default router;
