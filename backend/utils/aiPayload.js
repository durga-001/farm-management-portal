// Maps MongoDB documents (lean) -> the JSON shape the FastAPI service expects.
// DrugReference documents become "drug_facts": vet-entered values, never invented here.
export function buildPayload({ animals, records, refs, farms }) {
  const farmName = Object.fromEntries(
    farms.map((f) => [String(f._id), f.name]),
  );
  return {
    animals: animals.map((a) => ({
      id: String(a._id),
      label: a.animalId,
      type: a.type,
      age_months: a.ageMonths ?? null,
      weight: a.weight ?? null,
      farm_id: String(a.farm),
      farm_name: farmName[String(a.farm)] || null,
    })),
    records: records.map((r) => ({
      id: String(r._id),
      animal_id: String(r.animal),
      medicine: r.medicine,
      dosage: r.dosage ?? null,
      dosage_unit: r.dosageUnit || null,
      duration_days: r.durationDays ?? null,
      treatment_date: r.treatmentDate ?? null,
      created_at: r.createdAt ?? null,
      withdrawal_period_days: r.withdrawalPeriodDays ?? null,
      is_antimicrobial: !!r.isAntimicrobial,
      prescribed: !!r.prescribedBy,
      is_synthetic: !!r.isSynthetic,
    })),
    drug_facts: refs.map((d) => ({
      drug_name: d.drugName,
      species: d.species || [],
      dosage_value: d.dosage?.value ?? null,
      dosage_unit: d.dosage?.unit || null,
      duration_days: d.durationDays ?? null,
      withdrawal_period_days: d.withdrawalPeriodDays ?? null,
      milk_withdrawal_period_days: d.milkWithdrawalPeriodDays ?? null,
      source_title: d.source?.title || null,
      source_url: d.source?.url || null,
    })),
  };
}
