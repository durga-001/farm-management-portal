import express from "express";
import bcrypt from "bcryptjs";
import Veterinarian from "../models/Veterinarian.js";
import Farm from "../models/Farm.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRole("admin"), async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ message: "Name, email and password are required." });

  const exists = await Veterinarian.findOne({ email });
  if (exists)
    return res.status(409).json({ message: "Email already registered." });

  const hashed = await bcrypt.hash(password, 10);
  const vet = await Veterinarian.create({
    name,
    email,
    password: hashed,
    phone: phone || "",
  });
  res
    .status(201)
    .json({ _id: vet._id, name: vet.name, email: vet.email, phone: vet.phone });
});

router.get("/", requireRole("admin"), async (req, res) => {
  const vets = await Veterinarian.find()
    .select("-password")
    .sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    vets.map(async (v) => ({
      ...v.toObject(),
      assignedFarmCount: await Farm.countDocuments({ assignedVet: v._id }),
    })),
  );
  res.json(withCounts);
});

router.get("/mine", requireRole("farmer"), async (req, res) => {
  const farm = await Farm.findById(req.user.farmId).populate(
    "assignedVet",
    "name email phone",
  );
  if (!farm || !farm.assignedVet) return res.json(null);
  res.json(farm.assignedVet);
});

export default router;
