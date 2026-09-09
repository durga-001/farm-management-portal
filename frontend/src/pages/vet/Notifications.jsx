import { useState } from "react";
import { useData } from "../../context/DataContext";

export default function VetNotifications() {
  const { farms, notifications, vetSendNotification } = useData();
  const [recipient, setRecipient] = useState("all");
  const [farmId, setFarmId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setSuccess("");
    if (recipient === "specific" && !farmId)
      return setError("Select a farmer.");
    if (!message.trim()) return setError("Write a message first.");
    try {
      await vetSendNotification(
        recipient === "all" ? "all" : farmId,
        message,
        title,
      );
      setTitle("");
      setMessage("");
      setError("");
      setSuccess("Notification sent.");
    } catch (err) {
      setError(err.message);
    }
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
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setFarmId("");
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Farmers</option>
            <option value="specific">Specific Farmer</option>
          </select>
        </div>
        {recipient === "specific" && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Farmer</label>
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select farmer</option>
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.ownerName})
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="e.g. Withdrawal reminder"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="e.g. Animal AN-1002 is still within its withdrawal period."
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
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
            {n.title && (
              <p className="text-sm text-gray-900 font-medium">{n.title}</p>
            )}
            <p className="text-sm text-gray-800">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              To: {n.farm ? n.farm.name : "All assigned farmers"} ·{" "}
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
