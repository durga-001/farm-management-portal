import mongoose from "mongoose";

const animalSchema = new mongoose.Schema({
  animalId: { type: String, required: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
  type: { type: String, required: true },
  ageMonths: { type: Number, required: true },
  weight: { type: Number, required: true },
  status: { type: String, enum: ["safe", "withdrawal", "unsafe"], default: "safe" },
}, { timestamps: true });

export default mongoose.model("Animal", animalSchema);
