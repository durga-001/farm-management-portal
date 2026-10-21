import express from "express";
import Animal from "../models/Animal.js";
import VetNote from "../models/VetNote.js";
import { requireAuth } from "../middleware/auth.js";
import { retrieve, askLLM } from "../services/rag.js";

const router = express.Router();
router.use(requireAuth);

async function buildFarmContext(farmId) {
  const animals = await Animal.find({ farm: farmId });
  const notes = await VetNote.find({ farm: farmId })
    .sort({ createdAt: -1 })
    .limit(10);
  const a = animals
    .map(
      (x) =>
        `${x.animalId} (${x.type}, ${x.ageMonths} months): status ${x.status}`,
    )
    .join("\n");
  const n = notes
    .map(
      (x) =>
        `${x.animalId ? x.animalId : "Whole farm"}: ${x.text} (vet note, ${x.createdAt.toDateString()})`,
    )
    .join("\n");
  return `Animals:\n${a || "none"}\n\nVet notes:\n${n || "none"}`;
}

router.post("/ask", async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question)
    return res.status(400).json({ message: "Question is required." });

  const isFarmer = req.user.role === "farmer";
  const farmId = isFarmer ? req.user.farmId : req.body.farmId; // vets may optionally pick a farm

  try {
    const chunks = retrieve(question, 4);
    const farmContext = farmId ? await buildFarmContext(farmId) : "";
    const answer = await askLLM({
      question,
      role: isFarmer ? "farmer" : "veterinarian",
      chunks,
      farmContext,
    });
    res.json({ answer, sources: chunks.map((c) => c.doc.title) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "AI service failed. Check your API key." });
  }
});

export default router;
