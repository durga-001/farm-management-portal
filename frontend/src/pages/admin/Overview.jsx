import { useData } from "../../context/DataContext";
import StatCard from "../../components/StatCard";

export default function AdminOverview() {
  const { animals, farms, loading } = useData();
  const unsafe = animals.filter((a) => a.status === "unsafe").length;

  const perFarm = farms.map((f) => {
    const list = animals.filter((a) => (a.farm?._id || a.farm) === f._id);
    return { name: f.name, safe: list.filter((a) => a.status === "safe").length, unsafe: list.filter((a) => a.status !== "safe").length };
  });
  const maxPerFarm = Math.max(1, ...perFarm.map((f) => f.safe + f.unsafe));

  const statusCounts = ["safe", "withdrawal", "unsafe"].map((s) => ({ status: s, count: animals.filter((a) => a.status === s).length }));

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Overview</h1>
      <div className="flex gap-4 mb-8 flex-wrap">
        <StatCard label="Total farms" value={farms.length} />
        <StatCard label="Total animals" value={animals.length} />
        <StatCard label="Unsafe animals" value={unsafe} tone="danger" />
        <StatCard label="Registered farms" value={farms.length} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Animals per farm</h2>
          <div className="space-y-3">
            {perFarm.map((f) => (
              <div key={f.name}>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{f.name}</span><span>{f.safe + f.unsafe}</span></div>
                <div className="flex h-3 rounded overflow-hidden bg-gray-100">
                  <div className="bg-green-500" style={{ width: `${(f.safe / maxPerFarm) * 100}%` }} />
                  <div className="bg-red-500" style={{ width: `${(f.unsafe / maxPerFarm) * 100}%` }} />
                </div>
              </div>
            ))}
            {perFarm.length === 0 && <p className="text-sm text-gray-400">No farms registered yet.</p>}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Health status distribution</h2>
          <div className="space-y-3">
            {statusCounts.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-500 capitalize">{s.status}</div>
                <div className="flex-1 bg-gray-100 rounded h-3"><div className="bg-amber-500 h-3 rounded" style={{ width: `${animals.length ? (s.count / animals.length) * 100 : 0}%` }} /></div>
                <div className="w-6 text-xs text-gray-600 text-right">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
