import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import StatCard from "../../components/StatCard";

const levelStyle = {
  HIGH: "text-red-700 bg-red-50",
  MEDIUM: "text-amber-700 bg-amber-50",
  LOW: "text-green-700 bg-green-50",
};
const sevStyle = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-yellow-50 text-yellow-800",
  info: "bg-gray-100 text-gray-600",
};
const wdStyle = {
  SAFE: "text-green-700 bg-green-50",
  ACTIVE: "text-amber-700 bg-amber-50",
  COMPLETED: "text-blue-700 bg-blue-50",
  UNKNOWN: "text-gray-700 bg-gray-100",
};
const verdictText = {
  confirmed_issue: "Confirmed issue",
  false_alarm: "False alarm",
};

function FeedbackBox({ result, onSaved }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (verdict) => {
    setBusy(true);
    setError("");
    try {
      const saved = await api.submitAiFeedback({
        animalId: result.animal_id,
        verdict,
        comment,
      });
      setComment("");
      onSaved(result.animal_id, saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {result.feedback && (
        <p className="text-xs text-gray-600 mb-2">
          Your review:{" "}
          <span className="font-medium">
            {verdictText[result.feedback.verdict]}
          </span>
          {result.feedback.comment && <> — “{result.feedback.comment}”</>}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment (optional)"
          maxLength={1000}
          className="flex-1 min-w-[180px] border border-gray-300 rounded-md px-2 py-1 text-xs"
        />
        <button
          disabled={busy}
          onClick={() => send("confirmed_issue")}
          className="text-xs px-3 py-1 rounded-md bg-red-600 text-white disabled:opacity-50"
        >
          Confirm issue
        </button>
        <button
          disabled={busy}
          onClick={() => send("false_alarm")}
          className="text-xs px-3 py-1 rounded-md bg-gray-200 text-gray-800 disabled:opacity-50"
        >
          False alarm
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function AnimalCard({ r, onSaved }) {
  const c = r.clearance;
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-sm text-gray-800 font-medium">
          {r.label} · {r.farm_name}
          {r.includes_synthetic_records && (
            <span className="ml-2 text-[10px] uppercase tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              synthetic demo data
            </span>
          )}
        </span>
        <div className="flex gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${levelStyle[r.risk_level]}`}
          >
            {r.risk_level} RISK · score {r.risk_score}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${wdStyle[c.status]}`}
          >
            {c.status}
            {c.confidence != null &&
              ` · confidence ${c.confidence_level} (${c.confidence})`}
          </span>
        </div>
      </div>

      {r.signals.length === 0 ? (
        <p className="text-xs text-gray-400">No risk signals.</p>
      ) : (
        <ul className="space-y-1">
          {r.signals.map((s, i) => (
            <li
              key={i}
              className="text-xs text-gray-700 flex gap-2 items-start"
            >
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded ${sevStyle[s.severity]}`}
              >
                {s.severity}
                {s.points > 0 && ` +${s.points}`}
              </span>
              <span>{s.message}</span>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-2 text-xs text-gray-500">
        <summary className="cursor-pointer">How this was calculated</summary>
        <div className="mt-1 space-y-1">
          <p>
            Score = usage {r.score_breakdown.usage} + dose{" "}
            {r.score_breakdown.dose} + withdrawal {r.score_breakdown.withdrawal}{" "}
            + record quality {r.score_breakdown.record_quality}
            {r.score_breakdown.record_quality_cap_applied &&
              " (missing-field points capped)"}
            . HIGH ≥ 6, MEDIUM ≥ 3.
          </p>
          <p>Clearance basis: {c.basis}</p>
          <ul className="list-disc list-inside">
            {c.reasons.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          {c.confidence_note && <p className="italic">{c.confidence_note}</p>}
        </div>
      </details>

      <FeedbackBox result={r} onSaved={onSaved} />
    </div>
  );
}

export default function AiRiskAnalysis() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [show, setShow] = useState("flagged");

  const load = useCallback(() => {
    api
      .getAiAnalysis()
      .then(setData)
      .catch((e) => setError(e.message));
    api
      .getAiFeedbackStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = (animalId, feedback) => {
    setData((d) => ({
      ...d,
      results: d.results.map((r) =>
        r.animal_id === animalId ? { ...r, feedback } : r,
      ),
    }));
    api
      .getAiFeedbackStats()
      .then(setStats)
      .catch(() => {});
  };

  if (error)
    return (
      <div>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={() => {
            setError("");
            load();
          }}
          className="text-xs px-3 py-1 rounded-md bg-gray-200"
        >
          Retry
        </button>
      </div>
    );
  if (!data) return <p className="text-sm text-gray-400">Analysing…</p>;

  const s = data.summary;
  const list = data.results.filter((r) =>
    show === "all"
      ? true
      : show === "unreviewed"
        ? r.risk_level !== "LOW" && !r.feedback
        : r.risk_level !== "LOW",
  );

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        AI Risk Analysis
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Explainable rule-based engine ({data.engine.version}). Every flag lists
        the signals that caused it.
      </p>

      <div className="space-y-2 mb-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg p-3">
          {data.engine.disclaimer}
        </div>
        {s.vet_references_available === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
            No vet-entered drug references exist yet, so dose checks and
            “withdrawal shorter than reference” checks are inactive. Add entries
            (with a source) on the Drug Reference page to enable them.
          </div>
        )}
        {s.animals_with_synthetic_records > 0 && (
          <div className="bg-purple-50 border border-purple-200 text-purple-800 text-xs rounded-lg p-3">
            {s.animals_with_synthetic_records} animal(s) include SYNTHETIC demo
            records. Feedback on them is stored but excluded from training
            exports.
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <StatCard label="Animals analysed" value={s.animals} />
        <StatCard label="High risk" value={s.HIGH} tone="danger" />
        <StatCard label="Medium risk" value={s.MEDIUM} tone="warn" />
        <StatCard label="Labels given" value={stats ? stats.total : "–"} />
      </div>
      {stats && (
        <p className="text-xs text-gray-500 mb-4">
          Vet feedback so far: {stats.confirmed_issue} confirmed ·{" "}
          {stats.false_alarm} false alarm · {stats.usable_for_training} usable
          for training (non-synthetic).
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-gray-500">Show</label>
        <select
          value={show}
          onChange={(e) => setShow(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs"
        >
          <option value="flagged">Flagged (Medium + High)</option>
          <option value="unreviewed">Flagged, not yet reviewed</option>
          <option value="all">All animals</option>
        </select>
        <span className="text-xs text-gray-400">{list.length} shown</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {list.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Nothing to show.</p>
        )}
        {list.map((r) => (
          <AnimalCard key={r.animal_id} r={r} onSaved={onSaved} />
        ))}
      </div>
    </div>
  );
}
