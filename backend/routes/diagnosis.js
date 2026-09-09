import express from "express";
import Animal from "../models/Animal.js";
import Farm from "../models/Farm.js";
import MedicineRecord from "../models/MedicineRecord.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  runDataDiagnosis,
  runAmuDiagnosis,
  computeAnimalRisk,
} from "../utils/diagnosis.js";

const router = express.Router();
router.use(requireAuth);

async function scopedData(req) {
  let animals;
  if (req.user.role === "farmer") {
    animals = await Animal.find({ farm: req.user.farmId });
  } else if (req.user.role === "vet") {
    const farms = await Farm.find({ assignedVet: req.user.vetId }).select(
      "_id",
    );
    animals = await Animal.find({ farm: { $in: farms.map((f) => f._id) } });
  } else {
    animals = await Animal.find();
  }
  const animalIds = animals.map((a) => a._id);
  const records = await MedicineRecord.find({ animal: { $in: animalIds } });
  const animalsById = Object.fromEntries(
    animals.map((a) => [String(a._id), a]),
  );
  return { animals, records, animalsById };
}

router.get("/data", requireRole("vet", "admin"), async (req, res) => {
  const { records, animalsById } = await scopedData(req);
  res.json(runDataDiagnosis(records, animalsById));
});

router.get("/amu", requireRole("vet", "admin"), async (req, res) => {
  const { records, animalsById } = await scopedData(req);
  const farms = await Farm.find().select("name");
  const farmsById = Object.fromEntries(farms.map((f) => [String(f._id), f]));
  res.json(runAmuDiagnosis(records, animalsById, farmsById));
});

router.get("/risk", async (req, res) => {
  const { animals, records } = await scopedData(req);
  const results = animals.map((a) => ({
    ...computeAnimalRisk(records, a),
    animalLabel: a.animalId,
    farmId: a.farm,
  }));
  res.json(results);
});

export default router;
