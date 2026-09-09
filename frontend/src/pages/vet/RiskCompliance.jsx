import { useEffect, useState } from "react";
import { api } from "../../services/api";

const riskColor = {
  LOW: "text-green-700 bg-green-50",
  MEDIUM: "text-amber-700 bg-amber-50",
  HIGH: "text-red-700 bg-red-50",
};
const withdrawalColor = {
  SAFE: "text-green-700 bg-green-50",
  ACTIVE: "text-amber-700 bg-amber-50",
  COMPLETED: "text-blue-700 bg-blue-50",
  UNKNOWN: "text-gray-600 bg-gray-100",
};

export default function RiskCompliance() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getRiskCompliance()
      .then(setResults)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!results) return <p className="text-sm text-gray-400">Loading…</p>;

  const sorted = [...results].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Risk & Compliance
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Explainable risk level and withdrawal status, derived from actual
        treatment history.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {sorted.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No animals to assess yet.</p>
        )}
        {sorted.map((r) => (
          <div key={r.animalId} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-800 font-medium">
                {r.animalLabel}
              </span>
              <div className="flex gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${riskColor[r.riskLevel]}`}
                >
                  {r.riskLevel} RISK
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${withdrawalColor[r.withdrawalStatus]}`}
                >
                  {r.withdrawalStatus}
                </span>
              </div>
            </div>
            {r.reasons.length > 0 ? (
              <ul className="text-xs text-gray-600 list-disc list-inside">
                {r.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">
                No risk factors identified.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
