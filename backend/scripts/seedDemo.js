// Seeds SYNTHETIC demo data built by ai-service/scripts/build_demo_data.py.
//   node scripts/seedDemo.js                       create demo farms/animals/records
//   node scripts/seedDemo.js --vet-email=me@x.com  attach demo farms to YOUR vet account
//   node scripts/seedDemo.js --clear               remove everything this script created
// Run from the backend/ folder (so .env is found).
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Veterinarian from "../models/Veterinarian.js";
import Farm from "../models/Farm.js";
import Animal from "../models/Animal.js";
import MedicineRecord from "../models/MedicineRecord.js";
import AiFeedback from "../models/AiFeedback.js";
import { isKnownAntimicrobial } from "../utils/antimicrobials.js";

dotenv.config();
const DEMO_VET_EMAIL = "demo.vet@example.com";
const DEMO_PASSWORD = "Demo@12345";
const DAY = 86400000;
const args = process.argv.slice(2);
const vetEmailArg = (
  args.find((a) => a.startsWith("--vet-email=")) || ""
).split("=")[1];
const here = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(here, "../../ai-service/data/demo_seed.json");

await mongoose.connect(process.env.MONGODB_URI);
const demoFarms = await Farm.find({ name: /^\[DEMO\]/ }).select("_id");
const farmIds = demoFarms.map((f) => f._id);

if (args.includes("--clear")) {
  await AiFeedback.deleteMany({ farm: { $in: farmIds } });
  await MedicineRecord.deleteMany({ farm: { $in: farmIds } });
  await Animal.deleteMany({ farm: { $in: farmIds } });
  await Farm.deleteMany({ _id: { $in: farmIds } });
  await Veterinarian.deleteOne({ email: DEMO_VET_EMAIL });
  console.log(
    `Removed ${farmIds.length} demo farm(s) and their animals/records/feedback.`,
  );
  process.exit(0);
}
if (farmIds.length) {
  console.log("Demo data already exists. Run with --clear first.");
  process.exit(1);
}
if (!fs.existsSync(seedPath)) {
  console.log(
    `Missing ${seedPath}\nRun: python scripts/build_demo_data.py (inside ai-service)`,
  );
  process.exit(1);
}
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

let vet = await Veterinarian.findOne({ email: vetEmailArg || DEMO_VET_EMAIL });
if (!vet && vetEmailArg) {
  console.log(`No vet account with email ${vetEmailArg}`);
  process.exit(1);
}
if (!vet)
  vet = await Veterinarian.create({
    name: "Demo Vet",
    email: DEMO_VET_EMAIL,
    password: hash,
    licenseNumber: "DEMO",
  });

const now = Date.now();
let nAnimals = 0,
  nRecords = 0;
for (const f of seed.farms) {
  const farm = await Farm.create({
    name: `[DEMO] ${f.datasetFarmId}`,
    ownerName: "Demo Owner",
    location: "Demo location (synthetic)",
    email: `demo.${f.datasetFarmId.toLowerCase()}@example.com`,
    password: hash,
    assignedVet: vet._id,
  });
  const animals = await Animal.insertMany(
    f.animals.map((a) => ({
      animalId: a.animalId,
      farm: farm._id,
      type: "Cow",
      ageMonths: a.ageMonths,
      weight: a.weight,
      isSynthetic: true,
    })),
  );
  const idByLabel = Object.fromEntries(animals.map((a) => [a.animalId, a._id]));
  const docs = f.records.map((r) => {
    const entered = new Date(now - r.enteredDaysAgo * DAY);
    return {
      animal: idByLabel[r.animalId],
      farm: farm._id,
      medicine: r.medicine,
      dosage: r.dosage,
      dosageUnit: r.dosageUnit,
      durationDays: r.durationDays,
      treatmentDate:
        r.treatedDaysAgo == null
          ? null
          : new Date(now - r.treatedDaysAgo * DAY),
      withdrawalPeriodDays: r.withdrawalPeriodDays,
      prescribedBy: r.prescribed ? vet._id : null,
      isAntimicrobial: isKnownAntimicrobial(r.medicine),
      isSynthetic: true,
      createdAt: entered,
      updatedAt: entered, // explicit: bypasses auto-timestamps
    };
  });
  if (docs.length) await MedicineRecord.collection.insertMany(docs);
  nAnimals += animals.length;
  nRecords += docs.length;
}

console.log(
  `\nSeeded ${seed.farms.length} demo farms, ${nAnimals} animals, ${nRecords} SYNTHETIC records.`,
);
console.log(
  `Vet login: ${vet.email}${vetEmailArg ? " (your existing account)" : ` / ${DEMO_PASSWORD}`}`,
);
console.log(
  "\nInjected test cases (search these animal IDs on the AI Risk Analysis page):",
);
for (const t of seed.testCases)
  console.log(
    ` ${t.animalId}  ${t.description}\n    expect: ${t.expectedSignals.join(", ") || "(no flags)"}`,
  );
await mongoose.disconnect();
