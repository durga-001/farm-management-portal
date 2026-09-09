import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { ANIMAL_TYPES, MEDICINES } from "../../data/mockData";

export default function AddMedicine() {
  const { user } = useAuth();
  const { animals, addMedicineRecord } = useData();
  const navigate = useNavigate();
  const [type, setType] = useState(ANIMAL_TYPES[0]);
  const [animalId, setAnimalId] = useState("");
  const [medicine, setMedicine] = useState(MEDICINES[0]);
  const [error, setError] = useState("");

  const options = animals.filter((a) => a.farmId === user.farmId && a.type === type);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!animalId) {
      setError("Select an animal.");
      return;
    }
    addMedicineRecord(animalId, medicine);
    navigate("/farmer/animals");
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Add medicine record</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Animal type</label>
          <select value={type} onChange={(e) => { setType(e.target.value); setAnimalId(""); }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {ANIMAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Animal ID</label>
          <select value={animalId} onChange={(e) => setAnimalId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Select animal</option>
            {options.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Medicine</label>
          <select value={medicine} onChange={(e) => setMedicine(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {MEDICINES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700">Save record</button>
      </form>
    </div>
  );
}
