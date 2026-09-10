import express from "express";
import Veterinarian from "../models/Veterinarian.js";
import Farm from "../models/Farm.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", requireRole("farmer", "vet"), async (req, res) => {
  const vets = await Veterinarian.find()
    .select("-password")
    .sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    vets.map(async (v) => ({
      ...v.toObject(),
      assignedFarmCount: await Farm.countDocuments({ assignedVet: v._id }),
    })),
  );
  res.json(withCounts);
});

router.get("/mine", requireRole("farmer"), async (req, res) => {
  const farm = await Farm.findById(req.user.farmId).populate(
    "assignedVet",
    "name email phone",
  );
  if (!farm || !farm.assignedVet) return res.json(null);
  res.json(farm.assignedVet);
});

export default router;
