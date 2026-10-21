import mongoose from "mongoose";

const vetNoteSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    animalId: { type: String, default: "" }, // empty = applies to whole farm
    text: { type: String, required: true },
    vet: { type: mongoose.Schema.Types.ObjectId }, // who wrote it
  },
  { timestamps: true },
);

export default mongoose.model("VetNote", vetNoteSchema);
