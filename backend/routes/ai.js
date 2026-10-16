import express from "express";
import Animal from "../models/Animal.js";
import Farm from "../models/Farm.js";
import MedicineRecord from "../models/MedicineRecord.js";
import DrugReference from "../models/DrugReference.js";
import AiFeedback from "../models/AiFeedback.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { analyzeBatch } from "../utils/aiClient.js";
import { buildPayload } from "../utils/aiPayload.js";

const router = express.Router();
router.use(requireAuth, requireRole("vet"));

const VERDICTS = ["confirmed_issue", "false_alarm"];

// Vets only ever see/analyse farms assigned to them (same rule as /api/diagnosis).
async function runAnalysis(vetId) {
  const farms = await Farm.find({ assignedVet: vetId }).select("name").lean();
  const animals = await Animal.find({
    farm: { $in: farms.map((f) => f._id) },
  }).lean();
  const records = await MedicineRecord.find({
    animal: { $in: animals.map((a) => a._id) },
  }).lean();
  const refs = await DrugReference.find().lean();
  return analyzeBatch(buildPayload({ animals, records, refs, farms }));
}

const fail = (res, err) => {
  console.error("[ai]", err.message);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error." });
};

// GET /api/ai/analysis  -> risk level + signals for every animal, with this vet's latest feedback
router.get("/analysis", async (req, res) => {
  try {
    const ai = await runAnalysis(req.user.vetId);
    const rows = await AiFeedback.find({
      animal: { $in: ai.results.map((r) => r.animal_id) },
      vet: req.user.vetId,
    })
      .sort({ createdAt: -1 })
      .lean();
    const latest = {};
    for (const f of rows) {
      const k = String(f.animal);
      if (!latest[k])
        latest[k] = {
          verdict: f.verdict,
          comment: f.comment,
          createdAt: f.createdAt,
          riskLevelAtReview: f.riskLevel,
        };
    }
    res.json({
      ...ai,
      results: ai.results.map((r) => ({
        ...r,
        feedback: latest[r.animal_id] || null,
      })),
    });
  } catch (err) {
    fail(res, err);
  }
});

// POST /api/ai/feedback  { animalId, verdict: "confirmed_issue" | "false_alarm", comment }
// The snapshot is recomputed on the server, so the client cannot forge training data.
router.post("/feedback", async (req, res) => {
  try {
    const { animalId, verdict, comment } = req.body;
    if (!animalId || !VERDICTS.includes(verdict))
      return res.status(400).json({
        message: `animalId and verdict (${VERDICTS.join(" | ")}) are required.`,
      });

    const ai = await runAnalysis(req.user.vetId);
    const r = ai.results.find((x) => x.animal_id === String(animalId));
    if (!r)
      return res
        .status(404)
        .json({ message: "Animal not found among your assigned farms." });

    const doc = await AiFeedback.create({
      animal: r.animal_id,
      farm: r.farm_id,
      vet: req.user.vetId,
      verdict,
      comment: String(comment || "").slice(0, 1000),
      riskLevel: r.risk_level,
      riskScore: r.risk_score,
      signals: r.signals.map((s) => ({
        code: s.code,
        severity: s.severity,
        points: s.points,
        message: s.message,
      })),
      features: r.features,
      engineVersion: ai.engine.version,
      analyzedAt: ai.as_of,
      usedSyntheticData: r.includes_synthetic_records,
    });
    res.status(201).json({
      verdict: doc.verdict,
      comment: doc.comment,
      createdAt: doc.createdAt,
      riskLevelAtReview: doc.riskLevel,
    });
  } catch (err) {
    fail(res, err);
  }
});

// GET /api/ai/feedback/stats  -> how many labels you have, and how many are usable for training
router.get("/feedback/stats", async (req, res) => {
  try {
    const rows = await AiFeedback.find({ vet: req.user.vetId })
      .select("verdict usedSyntheticData")
      .lean();
    const real = rows.filter((r) => !r.usedSyntheticData);
    res.json({
      total: rows.length,
      confirmed_issue: rows.filter((r) => r.verdict === "confirmed_issue")
        .length,
      false_alarm: rows.filter((r) => r.verdict === "false_alarm").length,
      from_synthetic_demo_data: rows.length - real.length,
      usable_for_training: real.length,
    });
  } catch (err) {
    fail(res, err);
  }
});

// GET /api/ai/feedback/export[?includeSynthetic=true]  -> labelled rows for offline training
router.get("/feedback/export", async (req, res) => {
  try {
    const q = { vet: req.user.vetId };
    if (req.query.includeSynthetic !== "true") q.usedSyntheticData = false;
    const rows = await AiFeedback.find(q).sort({ createdAt: 1 }).lean();
    res.json(
      rows.map((f) => ({
        animal: f.animal,
        farm: f.farm,
        label: f.verdict === "confirmed_issue" ? 1 : 0,
        verdict: f.verdict,
        comment: f.comment,
        risk_level: f.riskLevel,
        risk_score: f.riskScore,
        features: f.features,
        signal_codes: (f.signals || []).map((s) => s.code),
        engine_version: f.engineVersion,
        used_synthetic_data: f.usedSyntheticData,
        created_at: f.createdAt,
      })),
    );
  } catch (err) {
    fail(res, err);
  }
});

export default router;
