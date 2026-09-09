import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

import authRoutes from "./routes/auth.js";
import animalRoutes from "./routes/animals.js";
import medicineRoutes from "./routes/medicine.js";
import farmRoutes from "./routes/farms.js";
import notificationRoutes from "./routes/notifications.js";
import statsRoutes from "./routes/stats.js";
import vetRoutes from "./routes/vets.js";
import diagnosisRoutes from "./routes/diagnosis.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/medicine", medicineRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/vets", vetRoutes);
app.use("/api/diagnosis", diagnosisRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error." });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() =>
    app.listen(PORT, () => console.log(`API running on port ${PORT}`)),
  )
  .catch((e) => console.error("DB connection failed:", e.message));
