import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import StatCard from "../../components/StatCard";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { animals, notifications, loading } = useData();

  const withdrawal = animals.filter((a) => a.status === "withdrawal").length;
  const unsafe = animals.filter((a) => a.status === "unsafe").length;
  const farmStatus = unsafe > 0 ? "Needs attention" : withdrawal > 0 ? "Under watch" : "Good standing";

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{user.farmName}</h1>
      <p className="text-sm text-gray-500 mb-6">Farm overview</p>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <>
          <div className="flex gap-4 mb-8 flex-wrap">
            <StatCard label="Total animals" value={animals.length} />
            <StatCard label="Under withdrawal" value={withdrawal} tone="warn" />
            <StatCard label="Farm status" value={farmStatus} tone={unsafe > 0 ? "danger" : "ok"} />
          </div>

          <h2 className="text-sm font-medium text-gray-900 mb-3">Notifications</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {notifications.length === 0 && <p className="p-4 text-sm text-gray-500">No notifications yet.</p>}
            {notifications.map((n) => (
              <div key={n._id} className="p-4">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
