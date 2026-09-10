import express from "express";
import Animal from "../models/Animal.js";
import Farm from "../models/Farm.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { draftAnimalFromImage } from "../utils/aiVision.js";

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
  }
  const animals = await Animal.find(query).sort({ createdAt: -1 });
  res.json(animals);
});

router.post("/ai-draft", requireRole("farmer"), async (req, res) => {
  const { imageBase64, mediaType } = req.body;
  const result = await draftAnimalFromImage({ imageBase64, mediaType });
  res.json(result);
});

router.post("/", async (req, res) => {
  if (req.user.role !== "farmer")
    return res.status(403).json({ message: "Only farmers can add animals." });
  const {
    animalId,
    type,
    ageMonths,
    weight,
    registrationMethod,
    aiSuggestion,
  } = req.body;
  if (!animalId || !type || !ageMonths || !weight)
    return res.status(400).json({ message: "All fields are required." });
  const animal = await Animal.create({
    animalId,
    type,
    ageMonths,
    weight,
    farm: req.user.farmId,
    registrationMethod:
      registrationMethod === "ai_assisted" ? "ai_assisted" : "manual",
    aiSuggestion: aiSuggestion || undefined,
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

router.patch("/:id/status", requireRole("vet"), async (req, res) => {
  const { status } = req.body;
  if (!["safe", "withdrawal", "unsafe"].includes(status))
    return res.status(400).json({ message: "Invalid status." });

  const animal = await Animal.findById(req.params.id);
  if (!animal) return res.status(404).json({ message: "Animal not found." });

  const farm = await Farm.findById(animal.farm).select("assignedVet");
  if (!farm || String(farm.assignedVet) !== String(req.user.vetId)) {
    return res.status(403).json({ message: "Not your assigned farm." });
  }

  animal.status = status;
  await animal.save();
  res.json(animal);
});

export default router;
