import mongoose from "mongoose";

const medicineRecordSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
    },
    medicine: { type: String, required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    dosage: { type: Number, default: null },
    dosageUnit: { type: String, default: null },
    durationDays: { type: Number, default: null },
    treatmentDate: { type: Date, default: null },
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      default: null,
    },
    withdrawalPeriodDays: { type: Number, default: null },
    isAntimicrobial: { type: Boolean, default: false },
    isSynthetic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("MedicineRecord", medicineRecordSchema);
