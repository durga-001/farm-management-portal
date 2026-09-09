import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", default: null }, // null = broadcast to all
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
