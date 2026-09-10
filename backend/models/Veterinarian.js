import mongoose from "mongoose";

const veterinarianSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    licenseNumber: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Veterinarian", veterinarianSchema);
