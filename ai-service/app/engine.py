"""Explainable rule-based AMU risk engine.

Design rules
  * FACT layer  = DrugReference entries sent in `drug_facts` (vet-entered, with a source).
                  Nothing in this file contains a drug dose / withdrawal / MRL number.
  * JUDGEMENT   = everything below: patterns, outliers, record quality, confidence.
  * Every flag carries the signals that caused it. No signal -> no flag.
"""
import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from statistics import mean, pstdev
from typing import Dict, List, Optional

from . import config as C
from .schemas import AnalyzeRequest, AnimalIn, DrugFactIn, RecordIn

DISCLAIMER = (
    "Rule-based decision support. Not clinically validated; thresholds are "
    "placeholders to be reviewed by a veterinarian. Clear/not-clear status is "
    "date arithmetic on recorded withdrawal periods, not a residue test."
)


# ----------------------------------------------------------------- helpers
def utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def days_between(a: datetime, b: datetime) -> float:
    return (a - b).total_seconds() / 86400.0


def event_time(r: RecordIn) -> Optional[datetime]:
    return utc(r.treatment_date) or utc(r.created_at)


def severity_for(points: int) -> str:
    return "info" if points <= 0 else "low" if points == 1 else "medium" if points == 2 else "high"


def sig(code: str, category: str, points: int, message: str, **evidence) -> dict:
    return {"code": code, "category": category, "points": points,
            "severity": severity_for(points), "message": message, "evidence": evidence}


def species_applies(animal_type: str, fact_species: List[str]) -> bool:
    if not fact_species:
        return True  # vet left species blank -> treat as general
    wanted = C.SPECIES_SYNONYMS.get(animal_type.strip().lower(), {animal_type.strip().lower()})
    return any(s.strip().lower() in wanted for s in fact_species)


def find_fact(medicine: str, animal: AnimalIn, facts: List[DrugFactIn]) -> Optional[DrugFactIn]:
    name = medicine.strip().lower()
    for f in facts:
        if f.drug_name.strip().lower() == name and species_applies(animal.type, f.species):
            return f
    return None


def reference_withdrawal_days(fact: Optional[DrugFactIn]) -> Optional[float]:
    """Conservative: the app does not record milk vs meat, so use the LONGER reference value."""
    if not fact:
        return None
    vals = [v for v in (fact.withdrawal_period_days, fact.milk_withdrawal_period_days) if v is not None]
    return max(vals) if vals else None


def check_dose(rec: RecordIn, animal: AnimalIn, fact: Optional[DrugFactIn]) -> dict:
    """Returns {status: high|low|ok|unverifiable, ratio, reason}. Never guesses."""
    if rec.dosage is None:
        return {"status": "unverifiable", "reason": "no_dose_recorded"}
    if fact is None or fact.dosage_value in (None, 0) or not fact.dosage_unit:
        return {"status": "unverifiable", "reason": "no_vet_reference"}
    ref_unit = fact.dosage_unit.strip().lower().replace(" ", "")
    rec_unit = (rec.dosage_unit or "").strip().lower()
    if rec_unit and ref_unit == rec_unit:
        ratio = rec.dosage / fact.dosage_value
        basis = f"{rec.dosage:g} {rec_unit} vs reference {fact.dosage_value:g} {rec_unit} (same unit)"
    elif rec_unit and ref_unit in (f"{rec_unit}/kg", f"{rec_unit}/kgbw"):
        if not animal.weight:
            return {"status": "unverifiable", "reason": "no_animal_weight"}
        per_kg = rec.dosage / animal.weight
        ratio = per_kg / fact.dosage_value
        basis = f"{per_kg:.3g} {rec_unit}/kg vs reference {fact.dosage_value:g} {fact.dosage_unit}"
    else:
        return {"status": "unverifiable", "reason": "unit_mismatch"}
    status = "high" if ratio > C.DOSE_HIGH_RATIO else "low" if ratio < C.DOSE_LOW_RATIO else "ok"
    return {"status": status, "ratio": round(ratio, 2), "basis": basis}


# ------------------------------------------------------------ per-animal
def analyze_animal(animal: AnimalIn, recs: List[RecordIn], facts: List[DrugFactIn],
                   peer_counts: List[int], now: datetime) -> dict:
    recs = sorted(recs, key=lambda r: event_time(r) or now)
    amu = [r for r in recs if r.is_antimicrobial]
    usage, dose, wd, rq = [], [], [], []          # signal buckets
    facts_used = False

    # ---- usage pattern (antimicrobials only) ----
    window = [r for r in amu
              if event_time(r) and 0 <= days_between(now, event_time(r)) <= C.RECENT_WINDOW_DAYS]
    n_window = len(window)
    if n_window >= C.FREQ_HIGH:
        usage.append(sig("FREQ_HIGH", "usage", 3,
                         f"{n_window} antimicrobial treatments in the last {C.RECENT_WINDOW_DAYS} days "
                         f"(high-frequency limit {C.FREQ_HIGH})", count=n_window))
    elif n_window >= C.FREQ_MEDIUM:
        usage.append(sig("FREQ_MEDIUM", "usage", 2,
                         f"{n_window} antimicrobial treatments in the last {C.RECENT_WINDOW_DAYS} days "
                         f"(limit {C.FREQ_MEDIUM})", count=n_window))

    by_drug = defaultdict(int)
    for r in window:
        by_drug[r.medicine.strip().lower()] += 1
    max_same = max(by_drug.values(), default=0)
    if max_same >= C.SAME_DRUG_REPEAT_COUNT:
        drug = max(by_drug, key=by_drug.get)
        usage.append(sig("REPEAT_SAME_DRUG", "usage", 2,
                         f"Same antimicrobial ({drug}) used {max_same} times in {C.RECENT_WINDOW_DAYS} days",
                         drug=drug, count=max_same))

    gaps = [days_between(event_time(b), event_time(a)) for a, b in zip(amu, amu[1:])
            if event_time(a) and event_time(b)]
    min_gap = min(gaps) if gaps else None
    if min_gap is not None and 0 <= min_gap < C.SHORT_INTERVAL_DAYS:
        pts = 2 if min_gap < C.VERY_SHORT_INTERVAL_DAYS else 1
        usage.append(sig("SHORT_INTERVAL", "usage", pts,
                         f"Only {min_gap:.1f} days between two antimicrobial treatments "
                         f"(limit {C.SHORT_INTERVAL_DAYS})", gap_days=round(min_gap, 1)))

    peer_z = None
    if len(peer_counts) >= C.MIN_PEERS:
        mu, sd = mean(peer_counts), max(pstdev(peer_counts), C.PEER_STD_FLOOR)
        peer_z = (n_window - mu) / sd
        if n_window >= C.PEER_MIN_COUNT and peer_z >= C.PEER_Z_THRESHOLD:
            usage.append(sig("PEER_OUTLIER", "usage", 2,
                             f"{n_window} treatments vs peer average {mu:.1f} "
                             f"({len(peer_counts)} same-type animals, z={peer_z:.1f})",
                             count=n_window, peer_mean=round(mu, 2), peers=len(peer_counts),
                             z=round(peer_z, 2)))

    # ---- per-record dose / withdrawal ----
    dose_unverifiable: Dict[str, int] = defaultdict(int)
    ratios, rec_conf = [], []
    assessed, unassessable = [], 0
    for r in amu:
        fact = find_fact(r.medicine, animal, facts)
        facts_used = facts_used or fact is not None
        d = check_dose(r, animal, fact)
        if d["status"] == "unverifiable":
            dose_unverifiable[d["reason"]] += 1
        else:
            ratios.append(d["ratio"])
        if d["status"] == "high":
            dose.append(sig("DOSE_HIGH", "dose", 3,
                            f"{r.medicine}: dose is {d['ratio']}x the vet-entered reference ({d['basis']})",
                            record=r.id, ratio=d["ratio"], source=fact.source_title))
        elif d["status"] == "low":
            dose.append(sig("DOSE_LOW", "dose", 1,
                            f"{r.medicine}: dose is only {d['ratio']}x the vet-entered reference ({d['basis']})",
                            record=r.id, ratio=d["ratio"], source=fact.source_title))
        if fact and fact.duration_days and r.duration_days and \
                r.duration_days > C.DURATION_LONG_RATIO * fact.duration_days:
            dose.append(sig("DURATION_LONG", "dose", 1,
                            f"{r.medicine}: duration {r.duration_days:g} d vs reference {fact.duration_days:g} d",
                            record=r.id))

        ref_days, farmer_days = reference_withdrawal_days(fact), r.withdrawal_period_days
        conf = 1.0
        notes = []
        if fact is None or ref_days is None:
            conf -= C.CONF_NO_REFERENCE
            notes.append(f"{r.medicine}: no vet-entered withdrawal reference, relies on farmer value")
        if farmer_days is None and ref_days is None:
            wd.append(sig("WITHDRAWAL_MISSING", "withdrawal", 3,
                          f"{r.medicine}: no withdrawal period recorded and no vet reference available",
                          record=r.id))
        elif farmer_days is None:
            wd.append(sig("WITHDRAWAL_NOT_ENTERED", "withdrawal", 1,
                          f"{r.medicine}: farmer did not enter a withdrawal period (reference value used)",
                          record=r.id))
        elif ref_days is not None and farmer_days < ref_days:
            conf -= C.CONF_FARMER_BELOW_REF
            wd.append(sig("WITHDRAWAL_SHORT_VS_REF", "withdrawal", 3,
                          f"{r.medicine}: recorded withdrawal {farmer_days:g} d is shorter than the "
                          f"vet-entered reference {ref_days:g} d",
                          record=r.id, recorded=farmer_days, reference=ref_days, source=fact.source_title))
            notes.append(f"{r.medicine}: recorded withdrawal below reference, reference used")
        if d["status"] == "unverifiable" and d["reason"] == "no_dose_recorded":
            conf -= C.CONF_DOSE_MISSING
            notes.append(f"{r.medicine}: dose missing")
        if d["status"] == "high":
            conf -= C.CONF_DOSE_HIGH
            notes.append(f"{r.medicine}: dose above reference, withdrawal may be longer")

        t = utc(r.treatment_date)
        lag = days_between(utc(r.created_at), t) if t and r.created_at else None
        if lag is not None and lag > C.LATE_ENTRY_DAYS:
            conf -= C.CONF_LATE_ENTRY
            notes.append(f"{r.medicine}: entered {lag:.0f} days after treatment")

        effective = max([v for v in (farmer_days, ref_days) if v is not None], default=None)
        if t is None or effective is None or t > now:      # undated, no withdrawal info, or future-dated
            unassessable += 1
            continue
        end = t + timedelta(days=effective)
        if 0 <= days_between(now, end) < 1:
            conf -= C.CONF_JUST_CLEARED
            notes.append(f"{r.medicine}: withdrawal ended less than 1 day ago")
        assessed.append((end, r))
        rec_conf.append((max(conf, 0.0), notes))

    if dose_unverifiable:
        labels = {"no_vet_reference": "no vet-entered reference", "no_dose_recorded": "dose not recorded",
                  "unit_mismatch": "units not comparable", "no_animal_weight": "animal weight missing"}
        parts = ", ".join(f"{n} x {labels[k]}" for k, n in dose_unverifiable.items())
        dose.append(sig("DOSE_NOT_VERIFIED", "dose", 0,
                        f"Dose could not be checked for some antimicrobial records ({parts}). "
                        "No dose judgement was made for them.", **dose_unverifiable))

    # ---- record quality (all records) ----
    def count(fn): return sum(1 for r in recs if fn(r))
    n_no_date = count(lambda r: r.treatment_date is None)
    n_no_dose = count(lambda r: r.dosage is None)
    n_no_dur = count(lambda r: r.duration_days is None)
    n_no_presc = count(lambda r: not r.prescribed)
    if n_no_date: rq.append(sig("MISSING_DATE", "record", 2, f"{n_no_date} record(s) without a treatment date", count=n_no_date))
    if n_no_dose: rq.append(sig("MISSING_DOSE", "record", 1, f"{n_no_dose} record(s) without a dose", count=n_no_dose))
    if n_no_dur: rq.append(sig("MISSING_DURATION", "record", 1, f"{n_no_dur} record(s) without a duration", count=n_no_dur))
    if n_no_presc: rq.append(sig("NO_PRESCRIBER", "record", 1, f"{n_no_presc} record(s) without a prescribing vet", count=n_no_presc))

    lags = []
    for r in recs:
        t = utc(r.treatment_date)
        if t and r.created_at and days_between(utc(r.created_at), t) > C.LATE_ENTRY_DAYS:
            lags.append(days_between(utc(r.created_at), t))
    if lags:
        rq.append(sig("LATE_ENTRY", "record", 2 if len(lags) >= 3 else 1,
                      f"{len(lags)} record(s) entered more than {C.LATE_ENTRY_DAYS} days after treatment "
                      f"(longest {max(lags):.0f} d)", count=len(lags), max_lag_days=round(max(lags), 1)))

    dups = 0
    for a, b in zip(recs, recs[1:]):
        ta, tb = event_time(a), event_time(b)
        if a.medicine.strip().lower() == b.medicine.strip().lower() and ta and tb \
                and abs(days_between(tb, ta)) * 24 <= C.DUPLICATE_WINDOW_HOURS:
            dups += 1
    if dups:
        rq.append(sig("DUPLICATE_ENTRY", "record", 2,
                      f"{dups} possible duplicate record(s): same medicine within {C.DUPLICATE_WINDOW_HOURS} h",
                      count=dups))

    created = sorted([utc(r.created_at) for r in recs if r.created_at and r.treatment_date])
    if len(created) >= C.BATCH_MIN_RECORDS:
        for i in range(len(created) - C.BATCH_MIN_RECORDS + 1):
            grp = created[i:i + C.BATCH_MIN_RECORDS]
            if (grp[-1] - grp[0]).total_seconds() <= C.BATCH_ENTRY_MINUTES * 60:
                tds = [utc(r.treatment_date) for r in recs if r.created_at and r.treatment_date
                       and grp[0] <= utc(r.created_at) <= grp[-1]]
                if tds and days_between(max(tds), min(tds)) >= C.BATCH_MIN_SPAN_DAYS:
                    rq.append(sig("BATCH_BACKFILL", "record", 2,
                                  f"{len(tds)} records entered within {C.BATCH_ENTRY_MINUTES} minutes but dated "
                                  f"{days_between(max(tds), min(tds)):.0f} days apart (possible back-filling)",
                                  count=len(tds)))
                    break

    invalid = [r for r in recs if (r.dosage is not None and r.dosage <= 0)
               or (r.duration_days is not None and r.duration_days <= 0)
               or (r.treatment_date and utc(r.treatment_date) > now)]
    invalid_sig = []
    if invalid:
        invalid_sig.append(sig("INVALID_RECORD", "record", 3,
                               f"{len(invalid)} record(s) with a future date or non-positive value",
                               count=len(invalid)))

    # ---- clearance ----
    clearance = build_clearance(amu, assessed, unassessable, rec_conf, now)

    if clearance["status"] == "ACTIVE":
        wd.append(sig("WITHDRAWAL_ACTIVE", "withdrawal", 1,
                      f"Withdrawal period still active ({clearance['days_remaining']} day(s) left, "
                      f"clear on {clearance['clear_on'][:10]})", clear_on=clearance["clear_on"]))

    # ---- score ----
    rq_points = sum(s["points"] for s in rq)
    rq_counted = min(rq_points, C.RECORD_QUALITY_POINT_CAP)
    breakdown = {
        "usage": sum(s["points"] for s in usage),
        "dose": sum(s["points"] for s in dose),
        "withdrawal": sum(s["points"] for s in wd),
        "record_quality": rq_counted + sum(s["points"] for s in invalid_sig),
        "record_quality_cap_applied": rq_points > C.RECORD_QUALITY_POINT_CAP,
    }
    score = breakdown["usage"] + breakdown["dose"] + breakdown["withdrawal"] + breakdown["record_quality"]
    signals = sorted(usage + dose + wd + rq + invalid_sig, key=lambda s: -s["points"])
    level = "HIGH" if score >= C.LEVEL_HIGH else "MEDIUM" if score >= C.LEVEL_MEDIUM else "LOW"
    if level == "LOW" and any(s["severity"] == "high" for s in signals):
        level = "MEDIUM"      # a single serious signal is never shown as LOW

    features = {
        "n_records": len(recs), "n_amu_records": len(amu), "amu_count_window": n_window,
        "distinct_amu_drugs": len({r.medicine.strip().lower() for r in amu}),
        "max_same_drug_window": max_same, "min_gap_days": None if min_gap is None else round(min_gap, 2),
        "max_dose_ratio": max(ratios) if ratios else None, "peer_z": None if peer_z is None else round(peer_z, 2),
        "n_peers": len(peer_counts), "late_entries": len(lags), "missing_dose": n_no_dose,
        "missing_date": n_no_date, "missing_duration": n_no_dur, "duplicates": dups,
        "withdrawal_status": clearance["status"], "clearance_confidence": clearance["confidence"],
        "facts_used": facts_used,
    }
    return {
        "animal_id": animal.id, "label": animal.label, "type": animal.type,
        "farm_id": animal.farm_id, "farm_name": animal.farm_name,
        "risk_level": level, "risk_score": score, "score_breakdown": breakdown,
        "signals": signals, "clearance": clearance, "features": features,
        "facts_used": facts_used, "records_analyzed": len(recs),
        "includes_synthetic_records": any(r.is_synthetic for r in recs),
    }


def build_clearance(amu, assessed, unassessable, rec_conf, now) -> dict:
    base = {"basis": "Longest of: farmer-entered withdrawal, vet-entered reference (milk/meat)."}
    if not amu:
        return {**base, "status": "SAFE", "clear_on": None, "days_remaining": None,
                "confidence": None, "confidence_level": "N/A",
                "reasons": ["No antimicrobial treatment recorded"]}
    active = [(end, r) for end, r in assessed if end > now]
    notes = [n for _, ns in rec_conf for n in ns]
    conf = min((c for c, _ in rec_conf), default=0.0)
    last_end = max((e for e, _ in assessed), default=None)
    if active:
        end = max(e for e, _ in active)
        status = "ACTIVE"
        reasons = [f"{r.medicine}: withdrawal ends {e:%Y-%m-%d}" for e, r in active]
        if unassessable:
            reasons.append(f"{unassessable} other antimicrobial record(s) could not be assessed")
    elif unassessable:
        status, end, conf = "UNKNOWN", last_end, 0.0
        reasons = [f"{unassessable} antimicrobial record(s) lack a treatment date or any withdrawal value, "
                   "so clearance cannot be determined"]
    else:
        status, end = "COMPLETED", last_end
        reasons = ["All recorded withdrawal periods have ended"]
    level = "HIGH" if conf >= C.CONF_HIGH_AT else "MEDIUM" if conf >= C.CONF_MEDIUM_AT else "LOW"
    return {**base, "status": status, "clear_on": end.isoformat() if end else None,
            "days_remaining": math.ceil((end - now).total_seconds() / 86400) if status == "ACTIVE" else None,
            "confidence": round(conf, 2), "confidence_level": level,
            "reasons": reasons + notes,
            "confidence_note": "Heuristic score from record completeness; not a probability."}


# ------------------------------------------------------------------ batch
def analyze(req: AnalyzeRequest) -> dict:
    now = utc(req.as_of) or datetime.now(timezone.utc)
    by_animal: Dict[str, List[RecordIn]] = defaultdict(list)
    for r in req.records:
        by_animal[r.animal_id].append(r)

    def window_count(recs):
        return sum(1 for r in recs if r.is_antimicrobial and event_time(r)
                   and 0 <= days_between(now, event_time(r)) <= C.RECENT_WINDOW_DAYS)

    counts = {a.id: window_count(by_animal[a.id]) for a in req.animals}
    by_type = defaultdict(list)
    for a in req.animals:
        by_type[a.type.strip().lower()].append(a.id)

    results = []
    for a in req.animals:
        peers = [counts[i] for i in by_type[a.type.strip().lower()] if i != a.id]
        results.append(analyze_animal(a, by_animal[a.id], req.drug_facts, peers, now))
    results.sort(key=lambda r: (-r["risk_score"], r["label"]))
    summary = {lvl: sum(1 for r in results if r["risk_level"] == lvl) for lvl in ("HIGH", "MEDIUM", "LOW")}
    summary.update(animals=len(results), vet_references_available=len(req.drug_facts),
                   animals_using_vet_references=sum(1 for r in results if r["facts_used"]),
                   animals_with_synthetic_records=sum(1 for r in results if r["includes_synthetic_records"]))
    return {"engine": {"version": C.ENGINE_VERSION, "type": "rule-based", "disclaimer": DISCLAIMER},
            "as_of": now.isoformat(), "summary": summary, "results": results}