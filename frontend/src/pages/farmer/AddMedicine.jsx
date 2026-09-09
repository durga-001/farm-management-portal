import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { ANIMAL_TYPES, MEDICINES, DOSAGE_UNITS } from "../../constants";

export default function AddMedicine() {
  const { animals, addMedicineRecord } = useData();
  const navigate = useNavigate();
  const [type, setType] = useState(ANIMAL_TYPES[0]);
  const [animalId, setAnimalId] = useState("");
  const [medicine, setMedicine] = useState(MEDICINES[0]);
  const [dosage, setDosage] = useState("");
  const [dosageUnit, setDosageUnit] = useState(DOSAGE_UNITS[0]);
  const [durationDays, setDurationDays] = useState("");
  const [treatmentDate, setTreatmentDate] = useState("");
  const [withdrawalPeriodDays, setWithdrawalPeriodDays] = useState("");
  const [error, setError] = useState("");

  const options = animals.filter((a) => a.type === type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!animalId) return setError("Select an animal.");
    try {
      await addMedicineRecord({
        animalId,
        medicine,
        dosage: dosage || undefined,
        dosageUnit: dosage ? dosageUnit : undefined,
        durationDays: durationDays || undefined,
        treatmentDate: treatmentDate || undefined,
        withdrawalPeriodDays: withdrawalPeriodDays || undefined,
      });
      navigate("/farmer/animals");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Add medicine record
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Animal type
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setAnimalId("");
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {ANIMAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Animal ID</label>
          <select
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select animal</option>
            {options.map((a) => (
              <option key={a._id} value={a._id}>
                {a.animalId}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Medicine</label>
          <select
            value={medicine}
            onChange={(e) => setMedicine(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {MEDICINES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              Dosage (optional)
            </label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              type="number"
              min="0"
              step="any"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="w-28">
            <label className="block text-sm text-gray-600 mb-1">Unit</label>
            <select
              value={dosageUnit}
              onChange={(e) => setDosageUnit(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {DOSAGE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Duration (days, optional)
          </label>
          <input
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            type="number"
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Treatment date (optional)
          </label>
          <input
            value={treatmentDate}
            onChange={(e) => setTreatmentDate(e.target.value)}
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Withdrawal period (days, optional)
          </label>
          <input
            value={withdrawalPeriodDays}
            onChange={(e) => setWithdrawalPeriodDays(e.target.value)}
            type="number"
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="As advised by your veterinarian"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700"
        >
          Save record
        </button>
      </form>
    </div>
  );
}
