from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class AnimalIn(BaseModel):
    id: str
    label: str                      # the farmer-facing animalId, e.g. "COW-12"
    type: str
    age_months: Optional[float] = None
    weight: Optional[float] = None
    farm_id: Optional[str] = None
    farm_name: Optional[str] = None


class RecordIn(BaseModel):
    id: str
    animal_id: str
    medicine: str
    dosage: Optional[float] = None
    dosage_unit: Optional[str] = None
    duration_days: Optional[float] = None
    treatment_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    withdrawal_period_days: Optional[float] = None   # farmer-entered
    is_antimicrobial: bool = False
    prescribed: bool = False
    is_synthetic: bool = False


class DrugFactIn(BaseModel):
    """One vet-entered DrugReference document. We do not verify the source ourselves."""
    drug_name: str
    species: List[str] = []
    dosage_value: Optional[float] = None
    dosage_unit: Optional[str] = None
    duration_days: Optional[float] = None
    withdrawal_period_days: Optional[float] = None
    milk_withdrawal_period_days: Optional[float] = None
    source_title: Optional[str] = None
    source_url: Optional[str] = None


class AnalyzeRequest(BaseModel):
    animals: List[AnimalIn]
    records: List[RecordIn]
    drug_facts: List[DrugFactIn] = []
    as_of: Optional[datetime] = None