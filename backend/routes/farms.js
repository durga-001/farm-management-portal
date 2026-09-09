import express from "express";
import Farm from "../models/Farm.js";
import Animal from "../models/Animal.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin", "vet"));

router.get("/", async (req, res) => {
  const query = req.user.role === "vet" ? { assignedVet: req.user.vetId } : {};
  const farms = await Farm.find(query)
    .select("-password")
    .populate("assignedVet", "name email")
    .sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    farms.map(async (f) => ({
      ...f.toObject(),
      animalCount: await Animal.countDocuments({ farm: f._id }),
    })),
  );
  res.json(withCounts);
});

router.patch("/:id/assign-vet", requireRole("admin"), async (req, res) => {
  const { vetId } = req.body;
  const farm = await Farm.findByIdAndUpdate(
    req.params.id,
    { assignedVet: vetId || null },
    { new: true },
  )
    .select("-password")
    .populate("assignedVet", "name email");
  if (!farm) return res.status(404).json({ message: "Farm not found." });
  res.json(farm);
});

export default router;
