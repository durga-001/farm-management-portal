import express from "express";
import Notification from "../models/Notification.js";
import Farm from "../models/Farm.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  let query = {};
  if (req.user.role === "farmer")
    query = { $or: [{ farm: req.user.farmId }, { farm: null }] };
  if (req.user.role === "vet") query = { sentBy: req.user.vetId };
  const notes = await Notification.find(query)
    .populate("farm", "name")
    .sort({ createdAt: -1 });
  res.json(notes);
});

router.post("/vet-send", requireRole("vet"), async (req, res) => {
  const { farmId, title, message } = req.body;
  if (!message)
    return res.status(400).json({ message: "Message is required." });

  if (farmId === "all") {
    const assignedFarms = await Farm.find({
      assignedVet: req.user.vetId,
    }).select("_id");
    const notes = await Promise.all(
      assignedFarms.map((f) =>
        Notification.create({
          farm: f._id,
          title: title || "",
          message,
          senderRole: "vet",
          sentBy: req.user.vetId,
        }),
      ),
    );
    return res.status(201).json(notes);
  }

  const farm = await Farm.findById(farmId).select("assignedVet");
  if (!farm || String(farm.assignedVet) !== String(req.user.vetId)) {
    return res
      .status(403)
      .json({ message: "That farmer is not assigned to you." });
  }
  const note = await Notification.create({
    farm: farmId,
    title: title || "",
    message,
    senderRole: "vet",
    sentBy: req.user.vetId,
  });
  res.status(201).json(note);
});

export default router;
