"""Build a DEMO seed file from the cattle dataset.

What is REAL (from the CSV): animal ids, age, weight, breed, which animals are grouped
into the same farm id, and the dataset's own Disease_Status label.
What is SYNTHETIC (generated here, clearly flagged): every treatment record, dose,
withdrawal value and entry delay. The CSV contains NO drug / treatment information.

Treatments are NOT medically matched to diseases. Dates are stored as "days ago" so the
demo always falls inside the engine's 90-day window whenever you seed it.

Usage (from ai-service/):  python scripts/build_demo_data.py
"""
import argparse, json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

DRUGS = ["Oxytetracycline", "Amoxicillin", "Enrofloxacin", "Ceftiofur", "Sulfadiazine"]  # same list as the app
COLS = ["Cattle_ID", "Breed", "Age_Months", "Weight_kg", "Farm_ID", "Disease_Status"]


def rec(animal, drug, treated, entered=None, dose="auto", unit="mg", dur=5, wd=7, presc=True, weight=500):
    """treated/entered are DAYS AGO (float). entered defaults to same day."""
    return {
        "animalId": animal, "medicine": drug,
        "dosage": round(weight * 10) if dose == "auto" else dose,   # arbitrary synthetic number
        "dosageUnit": unit if dose is not None else None,
        "durationDays": dur, "withdrawalPeriodDays": wd, "prescribed": presc,
        "treatedDaysAgo": treated,
        "enteredDaysAgo": (treated if entered is None else entered) if treated is not None else 0.0,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="data/raw/global_cattle_disease_detection_dataset.csv")
    ap.add_argument("--farms", type=int, default=4)
    ap.add_argument("--animals-per-farm", type=int, default=40)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="data/demo_seed.json")
    a = ap.parse_args()

    rng = np.random.default_rng(a.seed)
    df = pd.read_csv(a.csv, usecols=COLS)
    farm_ids = sorted(rng.choice(df.Farm_ID.unique(), size=a.farms, replace=False))

    farms, test_cases = [], []
    for fi, fid in enumerate(farm_ids):
        sub = df[df.Farm_ID == fid].sample(a.animals_per_farm, random_state=a.seed)
        animals, records = [], []
        for _, row in sub.iterrows():
            animals.append({"animalId": row.Cattle_ID, "ageMonths": int(row.Age_Months),
                            "weight": float(row.Weight_kg), "breed": row.Breed,
                            "datasetDiseaseStatus": row.Disease_Status})
            sick = row.Disease_Status != "Healthy"
            n = rng.choice([0, 1, 2], p=[.35, .5, .15] if sick else [.93, .07, 0.0])
            days = sorted(rng.choice(np.arange(8, 86), size=n, replace=False), reverse=True)
            for d in days:
                lag = float(rng.choice([0, 0, 1, 2]))
                records.append(rec(row.Cattle_ID, str(rng.choice(DRUGS)), float(d), float(max(d - lag, 0)),
                                   wd=int(rng.choice([7, 10, 14])), dur=int(rng.choice([3, 5, 7])),
                                   weight=float(row.Weight_kg)))

        if fi == 0:   # inject known cases into the first farm so you can verify the engine
            ids = [x["animalId"] for x in animals[:10]]
            cases = [
                ("CLEAN: complete record, long past withdrawal", [rec(ids[0], "Amoxicillin", 60)], []),
                ("REPEATED USE: same drug 4x in 38 days",
                 [rec(ids[1], "Oxytetracycline", d) for d in (38, 26, 14, 5)],
                 ["FREQ_MEDIUM", "REPEAT_SAME_DRUG", "SHORT_INTERVAL"]),
                ("LATE ENTRIES: 3 records entered ~30 days after treatment",
                 [rec(ids[2], DRUGS[i], t, t - 30 if t > 30 else 2) for i, t in enumerate((75, 60, 45))],
                 ["LATE_ENTRY"]),
                ("MISSING DATA: no date, dose, duration, withdrawal, prescriber",
                 [rec(ids[3], "Enrofloxacin", None, dose=None, dur=None, wd=None, presc=False)],
                 ["MISSING_DATE", "MISSING_DOSE", "MISSING_DURATION", "NO_PRESCRIBER", "WITHDRAWAL_MISSING"]),
                ("FUTURE DATE: treatment dated 5 days ahead", [rec(ids[4], "Ceftiofur", -5)], ["INVALID_RECORD"]),
                ("POSSIBLE DUPLICATE: same drug 2.4 h apart",
                 [rec(ids[5], "Amoxicillin", 20), rec(ids[5], "Amoxicillin", 19.9)],
                 ["DUPLICATE_ENTRY", "REPEAT_SAME_DRUG", "SHORT_INTERVAL"]),
                ("ACTIVE WITHDRAWAL: treated 2 days ago, 10-day withdrawal",
                 [rec(ids[6], "Sulfadiazine", 2, wd=10)], ["WITHDRAWAL_ACTIVE"]),
                ("BACK-FILLING: 5 records typed in 5 minutes, dated 5-60 days back",
                 [rec(ids[7], DRUGS[i], t, 1 - i / 1440) for i, t in enumerate((5, 15, 25, 40, 60))],
                 ["BATCH_BACKFILL", "FREQ_HIGH", "LATE_ENTRY"]),
                ("PEER OUTLIER: 3 different drugs while most peers have 0-1",
                 [rec(ids[8], DRUGS[i], t) for i, t in enumerate((70, 35, 10))],
                 ["FREQ_MEDIUM", "PEER_OUTLIER"]),
                ("WITHDRAWAL NOT RECORDED: complete record but no withdrawal value",
                 [rec(ids[9], "Oxytetracycline", 40, wd=None)], ["WITHDRAWAL_MISSING"]),
            ]
            injected = set(ids)
            records = [r for r in records if r["animalId"] not in injected]
            for desc, rs, expected in cases:
                records.extend(rs)
                test_cases.append({"animalId": rs[0]["animalId"], "description": desc, "expectedSignals": expected})

        farms.append({"datasetFarmId": fid, "animals": animals, "records": records})

    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provenance": {
            "animals": f"real rows from {Path(a.csv).name} (itself looks synthetic: see README notes)",
            "treatments": "SYNTHETIC - generated by build_demo_data.py; dataset has no treatment data",
        },
        "farms": farms, "testCases": test_cases,
    }
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(out, indent=1))
    n_rec = sum(len(f["records"]) for f in farms)
    print(f"Wrote {a.out}: {len(farms)} farms, {sum(len(f['animals']) for f in farms)} animals, "
          f"{n_rec} SYNTHETIC treatment records, {len(test_cases)} injected test cases")


if __name__ == "__main__":
    main()