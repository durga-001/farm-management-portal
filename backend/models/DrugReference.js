import mongoose from "mongoose";

const drugReferenceSchema = new mongoose.Schema(
  {
    drugName: { type: String, required: true, trim: true },
    species: [{ type: String, trim: true }],
    indication: { type: String, default: "" },
    dosage: {
      value: { type: Number, default: null },
      unit: { type: String, default: "" },
      route: { type: String, default: "" },
    },
    frequency: { type: String, default: "" },
    durationDays: { type: Number, default: null },
    withdrawalPeriodDays: { type: Number, default: null },
    milkWithdrawalPeriodDays: { type: Number, default: null },
    mrlNotes: { type: String, default: "" },
    source: {
      title: { type: String, required: true },
      url: { type: String, default: "" },
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: true,
    },
  },
  { timestamps: true },
);

drugReferenceSchema.index({ drugName: "text", indication: "text" });

export default mongoose.model("DrugReference", drugReferenceSchema);
