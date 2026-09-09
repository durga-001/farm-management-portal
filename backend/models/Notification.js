import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", default: null },
    title: { type: String, default: "" },
    message: { type: String, required: true },
    senderRole: { type: String, enum: ["admin", "vet"], default: "admin" },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", notificationSchema);
