import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", default: null },
    title: { type: String, default: "" },
    message: { type: String, required: true },
    senderRole: { type: String, enum: ["vet"], default: "vet" },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", notificationSchema);
