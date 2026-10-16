"""Run: pytest -q
IMPORTANT: every number in DrugFactIn(...) below is a FAKE, TEST-ONLY value used to
exercise the code paths. They are NOT veterinary facts."""
from datetime import datetime, timedelta, timezone

from app.engine import analyze
from app.schemas import AnalyzeRequest, AnimalIn, DrugFactIn, RecordIn

NOW = datetime(2026, 10, 4, 12, 0, tzinfo=timezone.utc)
FAKE_FACT = DrugFactIn(drug_name="TestDrug", species=["cattle"], dosage_value=10, dosage_unit="mg/kg",
                       duration_days=5, withdrawal_period_days=10, source_title="TEST-ONLY")


def ago(d): return NOW - timedelta(days=d)


def rec(i, animal="A1", med="TestDrug", days=30, entered=None, dose=5000, unit="mg", wd=10,
        amu=True, dur=5, presc=True, created=None):
    t = None if days is None else ago(days)
    return RecordIn(id=f"r{i}", animal_id=animal, medicine=med, dosage=dose, dosage_unit=unit,
                    duration_days=dur, treatment_date=t, withdrawal_period_days=wd,
                    created_at=created or (t + timedelta(days=entered or 0) if t else NOW),
                    is_antimicrobial=amu, prescribed=presc)


def run(records, facts=(), animals=None):
    animals = animals or [AnimalIn(id="A1", label="COW-1", type="Cow", weight=500)]
    out = analyze(AnalyzeRequest(animals=animals, records=records, drug_facts=list(facts), as_of=NOW))
    return out["results"][0]


def codes(res): return {s["code"] for s in res["signals"]}


def test_clean_record_is_low():
    r = run([rec(1, days=60)], [FAKE_FACT])
    assert r["risk_level"] == "LOW" and r["signals"] == []
    assert r["clearance"]["status"] == "COMPLETED" and r["clearance"]["confidence_level"] == "HIGH"


def test_no_facts_means_no_dose_judgement():
    r = run([rec(1, dose=999999)])               # absurd dose but no vet reference
    assert "DOSE_HIGH" not in codes(r) and "DOSE_NOT_VERIFIED" in codes(r)
    assert r["facts_used"] is False


def test_dose_high_per_kg_with_reference():
    r = run([rec(1, dose=7500)], [FAKE_FACT])    # 15 mg/kg vs 10 -> 1.5x
    assert "DOSE_HIGH" in codes(r) and r["risk_level"] in ("MEDIUM", "HIGH")


def test_unit_mismatch_is_not_judged():
    r = run([rec(1, dose=50, unit="ml")], [FAKE_FACT])
    assert "DOSE_HIGH" not in codes(r) and "DOSE_NOT_VERIFIED" in codes(r)


def test_species_mismatch_ignores_reference():
    goat_fact = DrugFactIn(drug_name="TestDrug", species=["goat"], dosage_value=1, dosage_unit="mg/kg",
                           withdrawal_period_days=99, source_title="TEST-ONLY")
    r = run([rec(1, dose=7500)], [goat_fact])
    assert r["facts_used"] is False and "DOSE_HIGH" not in codes(r)


def test_withdrawal_shorter_than_reference_uses_reference():
    r = run([rec(1, days=8, wd=3)], [FAKE_FACT])  # recorded 3d, reference 10d, treated 8d ago
    assert "WITHDRAWAL_SHORT_VS_REF" in codes(r)
    assert r["clearance"]["status"] == "ACTIVE"   # reference (10d) wins -> still active
    assert r["risk_level"] in ("MEDIUM", "HIGH")


def test_frequency_repeat_and_interval():
    recs = [rec(i, days=d) for i, d in enumerate([5, 12, 20, 30], 1)]
    r = run(recs, [FAKE_FACT])
    assert {"FREQ_MEDIUM", "REPEAT_SAME_DRUG", "SHORT_INTERVAL"} <= codes(r)
    assert r["risk_level"] == "HIGH"


def test_late_entry_and_missing_fields():
    r = run([rec(1, days=40, entered=20, dose=None, dur=None, presc=False)])
    assert {"LATE_ENTRY", "MISSING_DOSE", "MISSING_DURATION", "NO_PRESCRIBER"} <= codes(r)
    assert r["score_breakdown"]["record_quality"] <= 4 + 3   # cap applies


def test_missing_date_and_withdrawal_gives_unknown():
    r = run([rec(1, days=None, wd=None)])
    assert r["clearance"]["status"] == "UNKNOWN" and r["clearance"]["confidence_level"] == "LOW"
    assert {"MISSING_DATE", "WITHDRAWAL_MISSING"} <= codes(r)


def test_future_date_is_invalid_and_never_low():
    r = run([rec(1, days=-5)])
    assert "INVALID_RECORD" in codes(r) and r["risk_level"] != "LOW"
    assert r["clearance"]["status"] == "UNKNOWN"      # a future date must not count as an active withdrawal


def test_duplicate_within_24h():
    r = run([rec(1, days=20), rec(2, days=19.9)])
    assert "DUPLICATE_ENTRY" in codes(r)


def test_batch_backfill():
    base = ago(1)
    recs = [rec(i, days=d, created=base + timedelta(minutes=i)) for i, d in enumerate([5, 15, 25, 40, 60], 1)]
    assert "BATCH_BACKFILL" in codes(run(recs))


def test_active_withdrawal():
    r = run([rec(1, days=2, wd=10)])
    assert r["clearance"]["status"] == "ACTIVE" and "WITHDRAWAL_ACTIVE" in codes(r)
    assert r["clearance"]["days_remaining"] == 8


def test_peer_outlier():
    animals = [AnimalIn(id=f"P{i}", label=f"P{i}", type="Cow") for i in range(8)]
    animals.append(AnimalIn(id="A1", label="COW-1", type="Cow"))
    recs = [rec(i, days=d) for i, d in enumerate([10, 40], 1)]            # 2 treatments vs peers with 0
    res = analyze(AnalyzeRequest(animals=animals, records=recs, as_of=NOW))
    top = [x for x in res["results"] if x["animal_id"] == "A1"][0]
    assert "PEER_OUTLIER" in codes(top)


def test_peers_below_minimum_not_judged():
    animals = [AnimalIn(id="A1", label="COW-1", type="Cow"), AnimalIn(id="B", label="B", type="Cow")]
    res = analyze(AnalyzeRequest(animals=animals, records=[rec(1, days=10), rec(2, days=40)], as_of=NOW))
    assert all("PEER_OUTLIER" not in codes(x) for x in res["results"])


def test_non_antimicrobial_not_counted_as_amu():
    r = run([rec(i, med="Vitamin", amu=False, days=d) for i, d in enumerate([5, 10, 15, 20], 1)])
    assert not ({"FREQ_MEDIUM", "REPEAT_SAME_DRUG", "SHORT_INTERVAL"} & codes(r))
    assert r["clearance"]["status"] == "SAFE"


def test_every_flag_has_reasons():
    for res in (run([rec(1, days=2, wd=10)]), run([rec(1, days=-5)])):
        if res["risk_level"] != "LOW":
            assert res["signals"] and all(s["message"] for s in res["signals"])


def test_missing_withdrawal_without_reference_is_not_low():
    r = run([rec(1, days=40, wd=None)])
    assert "WITHDRAWAL_MISSING" in codes(r) and r["risk_level"] == "MEDIUM"
    assert r["clearance"]["status"] == "UNKNOWN"