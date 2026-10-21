import { useState } from "react";
import { api } from "../services/api";

export default function AIChat({ placeholder, farmId }) {
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);

  const ask = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    const question = q;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setLoading(true);
    try {
      const { answer, sources } = await api.askAI({ question, farmId });
      setMsgs((m) => [...m, { role: "ai", text: answer, sources }]);
    } catch (err) {
      setMsgs((m) => [...m, { role: "ai", text: err.message, sources: [] }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-96 overflow-y-auto mb-3 space-y-3">
        {msgs.length === 0 && (
          <p className="text-sm text-gray-400">
            Ask a question to get started.
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block text-sm rounded-lg px-3 py-2 max-w-[85%] text-left whitespace-pre-wrap ${m.role === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"}`}
            >
              {m.text}
            </div>
            {m.sources?.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Sources: {m.sources.join(", ")}
              </p>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Thinking…</p>}
      </div>
      <form onSubmit={ask} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button className="bg-gray-900 text-white rounded-md px-4 text-sm">
          Ask
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-2">
        AI gives general information, not a diagnosis. Always confirm with your
        veterinarian.
      </p>
    </div>
  );
}
