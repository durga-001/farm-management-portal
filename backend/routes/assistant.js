import express from "express";
import DrugReference from "../models/DrugReference.js";
import AssistantQuery from "../models/AssistantQuery.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.post("/ask", async (req, res) => {
  const question = String(req.body.question || "").trim();
  if (!question) return res.status(400).json({ message: "Question is required." });

  const words = [...new Set(question.toLowerCase().split(/\W+/).filter((w) => w.length >= 3))];
  const rx = words.map((w) => new RegExp(escapeRe(w), "i"));
  const results = rx.length
    ? await DrugReference.find({ $or: [{ drugName: { $in: rx } }, { indication: { $in: rx } }] })
        .limit(5)
        .lean()
    : [];

  await AssistantQuery.create({
    question,
    askedByRole: req.user.role,
    askedByFarmId: req.user.farmId || null,
    askedByVetId: req.user.vetId || null,
    status: results.length ? "answered_from_reference" : "no_reference_found",
    matchedDrugReferences: results.map((r) => r._id),
  });

  res.json({
    status: results.length ? "answered_from_reference" : "no_reference_found",
    message: results.length ? "" : "No matching entry in the vet-entered Drug Reference. Add one with a source.",
    results,
  });
});

export default router;