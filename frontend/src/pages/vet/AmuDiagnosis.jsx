import { useEffect, useState } from "react";
import { api } from "../../services/api";
import StatCard from "../../components/StatCard";

export default function AmuDiagnosis() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getAmuDiagnosis()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-gray-400">Loading…</p>;

  const maxDrugCount = Math.max(
    1,
    ...data.frequentlyUsedAntimicrobials.map((d) => d.count),
  );

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        AMU Usage Diagnosis
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Statistical review of antimicrobial usage patterns across your assigned
        farms.
      </p>

      <div className="flex gap-4 mb-8 flex-wrap">
        <StatCard
          label="Antimicrobial records"
          value={data.totalAntimicrobialRecords}
        />
        <StatCard
          label="Unusual animals"
          value={data.unusualAnimals.length}
          tone="warn"
        />
        <StatCard
          label="High-priority cases"
          value={data.highPriorityCases.length}
          tone="danger"
        />
        <StatCard
          label="Unusual farms"
          value={data.unusualFarms.length}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">
            Frequently used antimicrobials
          </h2>
          <div className="space-y-3">
            {data.frequentlyUsedAntimicrobials.map((d) => (
              <div key={d.medicine} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600 shrink-0 truncate">
                  {d.medicine}
                </div>
                <div className="flex-1 bg-gray-100 rounded h-3">
                  <div
                    className="bg-blue-500 h-3 rounded"
                    style={{ width: `${(d.count / maxDrugCount) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-sm text-gray-700 text-right">
                  {d.count}
                </div>
              </div>
            ))}
            {data.frequentlyUsedAntimicrobials.length === 0 && (
              <p className="text-sm text-gray-400">
                No antimicrobial usage recorded.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">
            Unusual farms
          </h2>
          <div className="space-y-2">
            {data.unusualFarms.map((f) => (
              <div key={f.farmName} className="flex justify-between text-sm">
                <span className="text-gray-800">{f.farmName}</span>
                <span className="text-amber-700">
                  {f.flaggedAnimalCount} flagged animal(s)
                </span>
              </div>
            ))}
            {data.unusualFarms.length === 0 && (
              <p className="text-sm text-gray-400">
                No unusual farm-level patterns found.
              </p>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-sm font-medium text-gray-900 mb-3">
        Unusual animals
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {data.unusualAnimals.length === 0 && (
          <p className="p-4 text-sm text-gray-500">
            No unusual usage patterns detected.
          </p>
        )}
        {data.unusualAnimals.map((a) => (
          <div key={a.animalId} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-800 font-medium">
                {a.animalId} · {a.farmName}
              </span>
              {a.highPriority && (
                <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  High priority
                </span>
              )}
            </div>
            <ul className="text-xs text-gray-600 list-disc list-inside">
              {a.flags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
