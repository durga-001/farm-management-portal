import { useState } from "react";
import { useData } from "../../context/DataContext";

const statusColor = { safe: "text-green-700 bg-green-50", withdrawal: "text-amber-700 bg-amber-50", unsafe: "text-red-700 bg-red-50" };

export default function Animals() {
  const { animals, deleteAnimal } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = animals
    .filter((a) => a.animalId.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => filter === "all" || a.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-gray-900">Animals</h1>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search animal ID" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
            <option value="all">All statuses</option>
            <option value="safe">Safe</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="unsafe">Unsafe</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr><th className="px-4 py-2">Animal ID</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Age (months)</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a._id}>
                <td className="px-4 py-2 text-gray-800">{a.animalId}</td>
                <td className="px-4 py-2 text-gray-600">{a.type}</td>
                <td className="px-4 py-2 text-gray-600">{a.ageMonths}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[a.status]}`}>{a.status}</span></td>
                <td className="px-4 py-2 text-right"><button onClick={() => deleteAnimal(a._id)} className="text-xs text-red-600 hover:underline">Delete</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">No animals found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
