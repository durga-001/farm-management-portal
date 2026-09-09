import mongoose from "mongoose";

const medicineRecordSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", required: true },
  medicine: { type: String, required: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
}, { timestamps: true });

export default mongoose.model("MedicineRecord", medicineRecordSchema);
