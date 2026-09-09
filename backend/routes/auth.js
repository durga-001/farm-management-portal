import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Farm from "../models/Farm.js";

const router = express.Router();

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  const { name, farmName, location, email, password } = req.body;
  if (!name || !farmName || !location || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const exists = await Farm.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already registered." });

  const hashed = await bcrypt.hash(password, 10);
  const farm = await Farm.create({ name: farmName, ownerName: name, location, email, password: hashed });

  const token = sign({ role: "farmer", farmId: farm._id });
  res.status(201).json({ token, user: { role: "farmer", farmId: farm._id, farmName: farm.name, name: farm.ownerName } });
});

router.post("/login", async (req, res) => {
  const { role, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  if (role === "admin") {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = sign({ role: "admin" });
      return res.json({ token, user: { role: "admin", name: "Admin" } });
    }
    return res.status(401).json({ message: "Invalid admin credentials." });
  }

  const farm = await Farm.findOne({ email });
  if (!farm) return res.status(401).json({ message: "Invalid email or password." });
  const match = await bcrypt.compare(password, farm.password);
  if (!match) return res.status(401).json({ message: "Invalid email or password." });

  const token = sign({ role: "farmer", farmId: farm._id });
  res.json({ token, user: { role: "farmer", farmId: farm._id, farmName: farm.name, name: farm.ownerName } });
});

export default router;
