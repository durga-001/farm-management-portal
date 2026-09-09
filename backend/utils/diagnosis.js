const DUPLICATE_WINDOW_HOURS = 24;
const SHORT_INTERVAL_DAYS = 14;
const REPEATED_TREATMENT_THRESHOLD = 3;
const RECENT_WINDOW_DAYS = 90;

function daysBetween(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function runDataDiagnosis(records, animalsById) {
  const issues = [];
  let duplicates = 0;

  const seen = new Map();
  const sorted = [...records].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  for (const r of sorted) {
    const key = `${r.animal}_${r.medicine}`;
    const prevTime = seen.get(key);
    const thisTime = new Date(r.treatmentDate || r.createdAt).getTime();
    if (
      prevTime != null &&
      Math.abs(thisTime - prevTime) / (1000 * 60 * 60) <= DUPLICATE_WINDOW_HOURS
    ) {
      duplicates += 1;
      issues.push({
        recordId: r._id,
        animalId: animalsById[r.animal]?.animalId || "unknown",
        issue: "Duplicate record",
      });
    }
    seen.set(key, thisTime);
  }

  let missingDosage = 0,
    missingDuration = 0,
    missingDate = 0,
    missingPrescription = 0;
  let missingWithdrawal = 0,
    missingAnimalDetails = 0,
    invalidRecords = 0;
  const flaggedIds = new Set(issues.map((i) => String(i.recordId)));

  for (const r of records) {
    let hasIssue = false;

    if (r.dosage == null) {
      missingDosage++;
      hasIssue = true;
      issues.push({ recordId: r._id, issue: "Missing dosage" });
    }
    if (r.durationDays == null) {
      missingDuration++;
      hasIssue = true;
      issues.push({ recordId: r._id, issue: "Missing duration" });
    }
    if (r.treatmentDate == null) {
      missingDate++;
      hasIssue = true;
      issues.push({ recordId: r._id, issue: "Missing treatment date" });
    }
    if (r.prescribedBy == null) {
      missingPrescription++;
      hasIssue = true;
      issues.push({
        recordId: r._id,
        issue: "Missing prescription/veterinarian info",
      });
    }
    if (r.isAntimicrobial && r.withdrawalPeriodDays == null) {
      missingWithdrawal++;
      hasIssue = true;
      issues.push({ recordId: r._id, issue: "Missing withdrawal information" });
    }

    const animal = animalsById[r.animal];
    if (
      !animal ||
      !animal.animalId ||
      !animal.type ||
      animal.ageMonths == null ||
      animal.weight == null
    ) {
      missingAnimalDetails++;
      hasIssue = true;
      issues.push({ recordId: r._id, issue: "Missing animal details" });
    }

    if (
      (r.dosage != null && r.dosage <= 0) ||
      (r.durationDays != null && r.durationDays <= 0) ||
      (r.treatmentDate && new Date(r.treatmentDate) > new Date())
    ) {
      invalidRecords++;
      hasIssue = true;
      issues.push({
        recordId: r._id,
        issue: "Invalid record (non-positive value or future date)",
      });
    }

    if (hasIssue) flaggedIds.add(String(r._id));
  }

  const totalRecords = records.length;
  const incompleteRecords = flaggedIds.size;
  const completeRecords = totalRecords - incompleteRecords;
  const score =
    totalRecords === 0
      ? 100
      : Math.round((completeRecords / totalRecords) * 100);

  return {
    score,
    recordsChecked: totalRecords,
    completeRecords,
    incompleteRecords,
    duplicateRecords: duplicates,
    missingDosage,
    missingDuration,
    missingTreatmentDate: missingDate,
    missingPrescription,
    missingWithdrawal,
    missingAnimalDetails,
    invalidRecords,
    affectedRecords: issues,
  };
}

export function runAmuDiagnosis(records, animalsById, farmsById) {
  const amuRecords = records.filter((r) => r.isAntimicrobial);
  const byAnimal = new Map();
  for (const r of amuRecords) {
    const key = String(r.animal);
    if (!byAnimal.has(key)) byAnimal.set(key, []);
    byAnimal.get(key).push(r);
  }

  const unusualAnimals = [];
  const drugCounts = new Map();
  const now = new Date();

  for (const [animalId, list] of byAnimal.entries()) {
    const sortedList = [...list].sort(
      (a, b) =>
        new Date(a.treatmentDate || a.createdAt) -
        new Date(b.treatmentDate || b.createdAt),
    );
    const flags = [];

    if (sortedList.length >= REPEATED_TREATMENT_THRESHOLD) {
      flags.push(
        `Repeated antimicrobial treatment (${sortedList.length} records)`,
      );
    }

    const recentCount = sortedList.filter(
      (r) =>
        daysBetween(now, new Date(r.treatmentDate || r.createdAt)) <=
        RECENT_WINDOW_DAYS,
    ).length;
    if (recentCount >= REPEATED_TREATMENT_THRESHOLD) {
      flags.push(
        `Unusual treatment frequency (${recentCount} treatments in the last ${RECENT_WINDOW_DAYS} days)`,
      );
    }

    for (let i = 1; i < sortedList.length; i++) {
      const gap = daysBetween(
        new Date(sortedList[i].treatmentDate || sortedList[i].createdAt),
        new Date(
          sortedList[i - 1].treatmentDate || sortedList[i - 1].createdAt,
        ),
      );
      if (gap < SHORT_INTERVAL_DAYS) {
        flags.push(
          `Short interval between treatments (${Math.round(gap)} days apart)`,
        );
        break;
      }
    }

    const drugNames = sortedList.map((r) => r.medicine);
    const repeatedDrug = drugNames.find(
      (d, idx) => drugNames.indexOf(d) !== idx,
    );
    if (repeatedDrug)
      flags.push(`Repeated use of the same antimicrobial (${repeatedDrug})`);

    for (const r of sortedList)
      drugCounts.set(r.medicine, (drugCounts.get(r.medicine) || 0) + 1);

    if (flags.length > 0) {
      const animal = animalsById[animalId];
      unusualAnimals.push({
        animalId: animal?.animalId || animalId,
        farmId: animal ? String(animal.farm) : null,
        farmName: animal
          ? farmsById[String(animal.farm)]?.name || "Unknown farm"
          : "Unknown farm",
        flags,
        highPriority: flags.length >= 2,
      });
    }
  }

  const farmFlagCounts = new Map();
  for (const a of unusualAnimals)
    farmFlagCounts.set(a.farmName, (farmFlagCounts.get(a.farmName) || 0) + 1);

  return {
    unusualAnimals: unusualAnimals.sort(
      (a, b) => b.flags.length - a.flags.length,
    ),
    unusualFarms: [...farmFlagCounts.entries()].map(([farmName, count]) => ({
      farmName,
      flaggedAnimalCount: count,
    })),
    frequentlyUsedAntimicrobials: [...drugCounts.entries()]
      .map(([medicine, count]) => ({ medicine, count }))
      .sort((a, b) => b.count - a.count),
    highPriorityCases: unusualAnimals.filter((a) => a.highPriority),
    totalAntimicrobialRecords: amuRecords.length,
  };
}

export function computeAnimalRisk(records, animal) {
  const now = new Date();
  const animalRecords = records
    .filter((r) => String(r.animal) === String(animal._id))
    .sort(
      (a, b) =>
        new Date(b.treatmentDate || b.createdAt) -
        new Date(a.treatmentDate || a.createdAt),
    );

  const antimicrobialRecords = animalRecords.filter((r) => r.isAntimicrobial);
  const reasons = [];
  let riskScore = 0;

  let withdrawalStatus = "SAFE";
  const latestWithWithdrawal = antimicrobialRecords.find(
    (r) => r.withdrawalPeriodDays != null && r.treatmentDate,
  );
  if (antimicrobialRecords.length === 0) {
    withdrawalStatus = "SAFE";
  } else if (!latestWithWithdrawal) {
    withdrawalStatus = "UNKNOWN";
    reasons.push(
      "Withdrawal period not recorded for recent antimicrobial treatment",
    );
  } else {
    const start = new Date(latestWithWithdrawal.treatmentDate);
    const end = new Date(
      start.getTime() +
        latestWithWithdrawal.withdrawalPeriodDays * 24 * 60 * 60 * 1000,
    );
    if (now < end) {
      withdrawalStatus = "ACTIVE";
      const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      reasons.push(
        `Withdrawal period still active (${daysLeft} day(s) remaining)`,
      );
      riskScore += 2;
    } else {
      withdrawalStatus = "COMPLETED";
    }
  }

  if (antimicrobialRecords.length >= REPEATED_TREATMENT_THRESHOLD) {
    reasons.push(
      `Repeated antimicrobial treatment (${antimicrobialRecords.length} records)`,
    );
    riskScore += 1;
  }

  const recentCount = antimicrobialRecords.filter(
    (r) =>
      daysBetween(now, new Date(r.treatmentDate || r.createdAt)) <=
      RECENT_WINDOW_DAYS,
  ).length;
  if (recentCount >= REPEATED_TREATMENT_THRESHOLD) {
    reasons.push(
      `Increased usage frequency (${recentCount} treatments in the last ${RECENT_WINDOW_DAYS} days)`,
    );
    riskScore += 1;
  }

  for (let i = 1; i < antimicrobialRecords.length; i++) {
    const gap = daysBetween(
      new Date(
        antimicrobialRecords[i - 1].treatmentDate ||
          antimicrobialRecords[i - 1].createdAt,
      ),
      new Date(
        antimicrobialRecords[i].treatmentDate ||
          antimicrobialRecords[i].createdAt,
      ),
    );
    if (gap < SHORT_INTERVAL_DAYS) {
      reasons.push(
        `Short interval between recent treatments (${Math.round(gap)} days)`,
      );
      riskScore += 1;
      break;
    }
  }

  let riskLevel = "LOW";
  if (riskScore >= 3) riskLevel = "HIGH";
  else if (riskScore >= 1) riskLevel = "MEDIUM";

  return { animalId: animal._id, riskLevel, reasons, withdrawalStatus };
}
