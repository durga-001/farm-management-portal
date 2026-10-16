import mongoose from "mongoose";

// One row = one vet judgement on one AI flag. Rows are future training labels.
const aiFeedbackSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
    },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    vet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: true,
    },
    verdict: {
      type: String,
      enum: ["confirmed_issue", "false_alarm"],
      required: true,
    },
    comment: { type: String, default: "", maxlength: 1000 },

    // Snapshot of what the engine said when the vet clicked (computed server-side).
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },
    riskScore: { type: Number, required: true },
    signals: [mongoose.Schema.Types.Mixed],
    features: mongoose.Schema.Types.Mixed,
    engineVersion: { type: String, required: true },
    analyzedAt: { type: Date },

    // Labels made on synthetic demo data must never be used to train a real model.
    usedSyntheticData: { type: Boolean, default: false },
  },
  { timestamps: true },
);

aiFeedbackSchema.index({ animal: 1, vet: 1, createdAt: -1 });

export default mongoose.model("AiFeedback", aiFeedbackSchema);
