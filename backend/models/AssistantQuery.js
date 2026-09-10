import mongoose from "mongoose";

const assistantQuerySchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    askedByRole: { type: String, enum: ["farmer", "vet"], required: true },
    askedByFarmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
      default: null,
    },
    askedByVetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      default: null,
    },
    status: {
      type: String,
      enum: ["answered_from_reference", "no_reference_found"],
      required: true,
    },
    matchedDrugReferences: [
      { type: mongoose.Schema.Types.ObjectId, ref: "DrugReference" },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("AssistantQuery", assistantQuerySchema);
