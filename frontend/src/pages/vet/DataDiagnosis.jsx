import { useEffect, useState } from "react";
import { api } from "../../services/api";
import StatCard from "../../components/StatCard";

export default function DataDiagnosis() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDataDiagnosis()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-gray-400">Loading…</p>;

  const scoreTone =
    data.score >= 80 ? "ok" : data.score >= 50 ? "warn" : "danger";

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Data Diagnosis
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Rule-based data quality check across your assigned farms' treatment
        records.
      </p>

      <div className="flex gap-4 mb-8 flex-wrap">
        <StatCard
          label="Data Quality Score"
          value={`${data.score}/100`}
          tone={scoreTone}
        />
        <StatCard label="Records checked" value={data.recordsChecked} />
        <StatCard
          label="Complete records"
          value={data.completeRecords}
          tone="ok"
        />
        <StatCard
          label="Incomplete records"
          value={data.incompleteRecords}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Duplicate records"
          value={data.duplicateRecords}
          tone="danger"
        />
        <StatCard
          label="Missing dosage"
          value={data.missingDosage}
          tone="warn"
        />
        <StatCard
          label="Missing duration"
          value={data.missingDuration}
          tone="warn"
        />
        <StatCard
          label="Missing treatment date"
          value={data.missingTreatmentDate}
          tone="warn"
        />
        <StatCard
          label="Missing prescription"
          value={data.missingPrescription}
          tone="warn"
        />
        <StatCard
          label="Missing withdrawal info"
          value={data.missingWithdrawal}
          tone="warn"
        />
        <StatCard
          label="Missing animal details"
          value={data.missingAnimalDetails}
          tone="warn"
        />
        <StatCard
          label="Invalid records"
          value={data.invalidRecords}
          tone="danger"
        />
      </div>

      <h2 className="text-sm font-medium text-gray-900 mb-3">
        Affected records
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {data.affectedRecords.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No issues found.</p>
        )}
        {data.affectedRecords.map((r, i) => (
          <div
            key={i}
            className="p-3 flex items-center justify-between text-sm"
          >
            <span className="text-gray-800">
              {r.animalId ? `${r.animalId} · ` : ""}Record{" "}
              {String(r.recordId).slice(-6)}
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
              {r.issue}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
