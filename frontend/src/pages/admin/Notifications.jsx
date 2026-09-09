import { useState } from "react";
import { useData } from "../../context/DataContext";

export default function Notifications() {
  const { farms, notifications, sendNotification } = useData();
  const [farmId, setFarmId] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return setError("Write a message first.");
    await sendNotification(farmId, message, title);
    setTitle("");
    setMessage("");
    setError("");
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Send notifications
      </h1>
      <form
        onSubmit={handleSend}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 max-w-lg mb-8"
      >
        <div>
          <label className="block text-sm text-gray-600 mb-1">Recipient</label>
          <select
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Broadcast to all farms</option>
            {farms.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="e.g. Animal AN-1002 is now safe for withdrawal."
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="bg-amber-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-amber-700"
        >
          Send
        </button>
      </form>
      <h2 className="text-sm font-medium text-gray-900 mb-3">
        Sent notifications
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {notifications.length === 0 && (
          <p className="p-4 text-sm text-gray-500">Nothing sent yet.</p>
        )}
        {notifications.map((n) => (
          <div key={n._id} className="p-4">
            <p className="text-sm text-gray-800">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              To: {n.farm ? n.farm.name : "All farms"} ·{" "}
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
