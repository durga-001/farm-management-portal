import { useData } from "../../context/DataContext";

export default function Farms() {
  const { farms } = useData();
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Farms</h1>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left"><tr><th className="px-4 py-2">Farm</th><th className="px-4 py-2">Owner</th><th className="px-4 py-2">Location</th><th className="px-4 py-2">Animals</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {farms.map((f) => (
              <tr key={f._id}><td className="px-4 py-2 text-gray-800">{f.name}</td><td className="px-4 py-2 text-gray-600">{f.ownerName}</td><td className="px-4 py-2 text-gray-600">{f.location}</td><td className="px-4 py-2 text-gray-600">{f.animalCount}</td></tr>
            ))}
            {farms.length === 0 && <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-400">No farms registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
