import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    location: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    assignedVet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Farm", farmSchema);
