import { useState } from "react";
import { api } from "../../services/api";

export default function VetAssistant() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return setError("Type a question first.");
    setLoading(true);
    setError("");
    try {
      const res = await api.askAssistant(question.trim());
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Veterinary Drug &amp; Dosage Research Assistant
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Answers are looked up only from the sourced drug reference library —
        never generated or guessed. If nothing is found, say so and consult your
        assigned veterinarian.
      </p>

      <form
        onSubmit={handleAsk}
        className="bg-white border border-gray-200 rounded-lg p-6 mb-8 flex gap-3"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Withdrawal period for Oxytetracycline in cattle"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Ask"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {result && result.results.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4">
          {result.message}
        </div>
      )}

      {result && result.results.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg p-3">
            Veterinarian review required before acting on this information.
          </div>
          {result.results.map((r, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  {r.drugName}
                </h2>
                {r.species?.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {r.species.join(", ")}
                  </span>
                )}
              </div>
              {r.indication && (
                <p className="text-sm text-gray-700 mb-2">{r.indication}</p>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
                {r.dosage?.value != null && (
                  <div>
                    <dt className="inline text-gray-400">Dosage: </dt>
                    <dd className="inline">
                      {r.dosage.value} {r.dosage.unit}{" "}
                      {r.dosage.route ? `(${r.dosage.route})` : ""}
                    </dd>
                  </div>
                )}
                {r.frequency && (
                  <div>
                    <dt className="inline text-gray-400">Frequency: </dt>
                    <dd className="inline">{r.frequency}</dd>
                  </div>
                )}
                {r.durationDays != null && (
                  <div>
                    <dt className="inline text-gray-400">Duration: </dt>
                    <dd className="inline">{r.durationDays} day(s)</dd>
                  </div>
                )}
                {r.withdrawalPeriodDays != null && (
                  <div>
                    <dt className="inline text-gray-400">
                      Withdrawal (meat):{" "}
                    </dt>
                    <dd className="inline">{r.withdrawalPeriodDays} day(s)</dd>
                  </div>
                )}
                {r.milkWithdrawalPeriodDays != null && (
                  <div>
                    <dt className="inline text-gray-400">
                      Withdrawal (milk):{" "}
                    </dt>
                    <dd className="inline">
                      {r.milkWithdrawalPeriodDays} day(s)
                    </dd>
                  </div>
                )}
              </dl>
              {r.mrlNotes && (
                <p className="text-xs text-gray-500 mb-3">{r.mrlNotes}</p>
              )}
              <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                Source:{" "}
                {r.source?.url ? (
                  <a
                    href={r.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {r.source.title}
                  </a>
                ) : (
                  r.source?.title
                )}
                {" · Entered by "}
                {r.enteredBy}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
