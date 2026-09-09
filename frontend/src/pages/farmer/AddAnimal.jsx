import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { ANIMAL_TYPES } from "../../constants";

export default function AddAnimal() {
  const { addAnimal } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ animalId: "", type: ANIMAL_TYPES[0], ageMonths: "", weight: "" });
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.animalId || !form.ageMonths || !form.weight) return setError("Fill in every field.");
    try {
      await addAnimal({ ...form, ageMonths: Number(form.ageMonths), weight: Number(form.weight) });
      navigate("/farmer/animals");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Add animal</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div><label className="block text-sm text-gray-600 mb-1">Animal ID</label>
          <input value={form.animalId} onChange={update("animalId")} placeholder="AN-1006" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
        <div><label className="block text-sm text-gray-600 mb-1">Type</label>
          <select value={form.type} onChange={update("type")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {ANIMAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select></div>
        <div><label className="block text-sm text-gray-600 mb-1">Age (months)</label>
          <input value={form.ageMonths} onChange={update("ageMonths")} type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
        <div><label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
          <input value={form.weight} onChange={update("weight")} type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700">Save animal</button>
      </form>
    </div>
  );
}
