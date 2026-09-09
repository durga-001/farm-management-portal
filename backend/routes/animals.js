import express from "express";
import Animal from "../models/Animal.js";
import Farm from "../models/Farm.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  let query = {};
  if (req.user.role === "farmer") {
    query = { farm: req.user.farmId };
  } else if (req.user.role === "vet") {
    const assignedFarms = await Farm.find({
      assignedVet: req.user.vetId,
    }).select("_id");
    const assignedIds = assignedFarms.map((f) => f._id);
    query = req.query.farmId
      ? {
          farm: {
            $in: assignedIds.filter((id) => String(id) === req.query.farmId),
          },
        }
      : { farm: { $in: assignedIds } };
  } else if (req.query.farmId) {
    query = { farm: req.query.farmId };
  }
  const animals = await Animal.find(query).sort({ createdAt: -1 });
  res.json(animals);
});

router.post("/", async (req, res) => {
  if (req.user.role !== "farmer")
    return res.status(403).json({ message: "Only farmers can add animals." });
  const { animalId, type, ageMonths, weight } = req.body;
  if (!animalId || !type || !ageMonths || !weight)
    return res.status(400).json({ message: "All fields are required." });
  const animal = await Animal.create({
    animalId,
    type,
    ageMonths,
    weight,
    farm: req.user.farmId,
  });
  res.status(201).json(animal);
});

router.delete("/:id", async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) return res.status(404).json({ message: "Animal not found." });
  if (
    req.user.role === "farmer" &&
    String(animal.farm) !== String(req.user.farmId)
  ) {
    return res.status(403).json({ message: "Not your animal." });
  }
  await animal.deleteOne();
  res.json({ message: "Deleted." });
});

router.patch("/:id/status", async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Only admin can update status." });
  const { status } = req.body;
  if (!["safe", "withdrawal", "unsafe"].includes(status))
    return res.status(400).json({ message: "Invalid status." });
  const animal = await Animal.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );
  if (!animal) return res.status(404).json({ message: "Animal not found." });
  res.json(animal);
});

export default router;
