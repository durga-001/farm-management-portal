import express from "express";
import Animal from "../models/Animal.js";
import MedicineRecord from "../models/MedicineRecord.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  if (req.user.role !== "farmer") return res.status(403).json({ message: "Only farmers can add medicine records." });
  const { animalId, medicine } = req.body;
  if (!animalId || !medicine) return res.status(400).json({ message: "Animal and medicine are required." });

  const animal = await Animal.findById(animalId);
  if (!animal || String(animal.farm) !== String(req.user.farmId)) {
    return res.status(404).json({ message: "Animal not found." });
  }

  const record = await MedicineRecord.create({ animal: animal._id, medicine, farm: req.user.farmId });
  animal.status = "withdrawal";
  await animal.save();

  res.status(201).json(record);
});

router.get("/:animalId", requireAuth, async (req, res) => {
  const records = await MedicineRecord.find({ animal: req.params.animalId }).sort({ createdAt: -1 });
  res.json(records);
});

export default router;
