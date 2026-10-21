import express from "express";
import VetNote from "../models/VetNote.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRole("admin"), async (req, res) => {
  const { farmId, animalId, text } = req.body;
  if (!farmId || !text)
    return res
      .status(400)
      .json({ message: "Farm and report text are required." });
  const note = await VetNote.create({
    farm: farmId,
    animalId,
    text,
    vet: req.user.vetId,
  });
  res.status(201).json(note);
});

export default router;
