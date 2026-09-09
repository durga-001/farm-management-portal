import express from "express";
import Notification from "../models/Notification.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// Farmer: own + broadcast. Admin: everything sent.
router.get("/", async (req, res) => {
  const query = req.user.role === "farmer" ? { $or: [{ farm: req.user.farmId }, { farm: null }] } : {};
  const notes = await Notification.find(query).populate("farm", "name").sort({ createdAt: -1 });
  res.json(notes);
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { farmId, message } = req.body;
  if (!message) return res.status(400).json({ message: "Message is required." });
  const note = await Notification.create({ farm: farmId === "all" ? null : farmId, message });
  res.status(201).json(note);
});

export default router;
