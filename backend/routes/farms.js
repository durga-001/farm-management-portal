import express from "express";
import Farm from "../models/Farm.js";
import Animal from "../models/Animal.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", async (req, res) => {
  const farms = await Farm.find().select("-password").sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    farms.map(async (f) => ({ ...f.toObject(), animalCount: await Animal.countDocuments({ farm: f._id }) }))
  );
  res.json(withCounts);
});

export default router;
