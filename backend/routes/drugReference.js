import express from "express";
import DrugReference from "../models/DrugReference.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? {
        $or: [
          { drugName: new RegExp(q, "i") },
          { indication: new RegExp(q, "i") },
        ],
      }
    : {};
  const entries = await DrugReference.find(filter)
    .populate("addedBy", "name")
    .sort({ drugName: 1 });
  res.json(entries);
});

router.post("/", requireRole("vet"), async (req, res) => {
  const {
    drugName,
    species,
    indication,
    dosage,
    frequency,
    durationDays,
    withdrawalPeriodDays,
    milkWithdrawalPeriodDays,
    mrlNotes,
    source,
  } = req.body;

  if (!drugName || !source?.title) {
    return res
      .status(400)
      .json({ message: "Drug name and a source title are required." });
  }

  const entry = await DrugReference.create({
    drugName,
    species: Array.isArray(species) ? species : [],
    indication: indication || "",
    dosage: dosage || {},
    frequency: frequency || "",
    durationDays:
      durationDays != null && durationDays !== "" ? Number(durationDays) : null,
    withdrawalPeriodDays:
      withdrawalPeriodDays != null && withdrawalPeriodDays !== ""
        ? Number(withdrawalPeriodDays)
        : null,
    milkWithdrawalPeriodDays:
      milkWithdrawalPeriodDays != null && milkWithdrawalPeriodDays !== ""
        ? Number(milkWithdrawalPeriodDays)
        : null,
    mrlNotes: mrlNotes || "",
    source,
    addedBy: req.user.vetId,
  });
  res.status(201).json(entry);
});

router.delete("/:id", requireRole("vet"), async (req, res) => {
  const entry = await DrugReference.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: "Entry not found." });
  if (String(entry.addedBy) !== String(req.user.vetId)) {
    return res
      .status(403)
      .json({ message: "You can only remove entries you added." });
  }
  await entry.deleteOne();
  res.json({ message: "Deleted." });
});

export default router;
