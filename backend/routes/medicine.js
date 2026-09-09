import express from "express";
import Animal from "../models/Animal.js";
import Farm from "../models/Farm.js";
import MedicineRecord from "../models/MedicineRecord.js";
import { requireAuth } from "../middleware/auth.js";
import { isKnownAntimicrobial } from "../utils/antimicrobials.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  if (req.user.role !== "farmer")
    return res
      .status(403)
      .json({ message: "Only farmers can add medicine records." });
  const {
    animalId,
    medicine,
    dosage,
    dosageUnit,
    durationDays,
    treatmentDate,
    withdrawalPeriodDays,
  } = req.body;
  if (!animalId || !medicine)
    return res
      .status(400)
      .json({ message: "Animal and medicine are required." });

  const animal = await Animal.findById(animalId);
  if (!animal || String(animal.farm) !== String(req.user.farmId)) {
    return res.status(404).json({ message: "Animal not found." });
  }

  const farm = await Farm.findById(req.user.farmId).select("assignedVet");

  const record = await MedicineRecord.create({
    animal: animal._id,
    medicine,
    farm: req.user.farmId,
    dosage: dosage != null && dosage !== "" ? Number(dosage) : null,
    dosageUnit: dosageUnit || null,
    durationDays:
      durationDays != null && durationDays !== "" ? Number(durationDays) : null,
    treatmentDate: treatmentDate ? new Date(treatmentDate) : null,
    withdrawalPeriodDays:
      withdrawalPeriodDays != null && withdrawalPeriodDays !== ""
        ? Number(withdrawalPeriodDays)
        : null,
    prescribedBy: farm?.assignedVet || null,
    isAntimicrobial: isKnownAntimicrobial(medicine),
  });
  animal.status = "withdrawal";
  await animal.save();

  res.status(201).json(record);
});

router.get("/:animalId", requireAuth, async (req, res) => {
  const animal = await Animal.findById(req.params.animalId);
  if (!animal) return res.status(404).json({ message: "Animal not found." });

  if (
    req.user.role === "farmer" &&
    String(animal.farm) !== String(req.user.farmId)
  ) {
    return res.status(403).json({ message: "Not your animal." });
  }
  if (req.user.role === "vet") {
    const farm = await Farm.findById(animal.farm).select("assignedVet");
    if (!farm || String(farm.assignedVet) !== String(req.user.vetId)) {
      return res.status(403).json({ message: "Not your assigned farm." });
    }
  }

  const records = await MedicineRecord.find({
    animal: req.params.animalId,
  }).sort({ createdAt: -1 });
  res.json(records);
});

export default router;
