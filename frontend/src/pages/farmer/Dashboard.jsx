import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { api } from "../../services/api";
import StatCard from "../../components/StatCard";

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

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { animals, notifications, myVet, loading } = useData();
  const [risk, setRisk] = useState([]);

  useEffect(() => {
    api
      .getRiskCompliance()
      .then(setRisk)
      .catch(() => setRisk([]));
  }, [animals]);

  const withdrawal = animals.filter((a) => a.status === "withdrawal").length;
  const unsafe = animals.filter((a) => a.status === "unsafe").length;
  const farmStatus =
    unsafe > 0
      ? "Needs attention"
      : withdrawal > 0
        ? "Under watch"
        : "Good standing";

  const alerts = risk.filter(
    (r) => r.riskLevel !== "LOW" || r.withdrawalStatus === "ACTIVE",
  );

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        {user.farmName}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Farm overview</p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="flex gap-4 mb-8 flex-wrap">
            <StatCard label="Total animals" value={animals.length} />
            <StatCard label="Under withdrawal" value={withdrawal} tone="warn" />
            <StatCard
              label="Farm status"
              value={farmStatus}
              tone={unsafe > 0 ? "danger" : "ok"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-medium text-gray-900 mb-3">
                My Veterinarian
              </h2>
              {myVet ? (
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium text-gray-900">{myVet.name}</p>
                  <p>{myVet.email}</p>
                  {myVet.phone && <p>{myVet.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No veterinarian has been assigned to your farm yet.
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-medium text-gray-900 mb-3">
                Risk & compliance alerts
              </h2>
              {alerts.length === 0 && (
                <p className="text-sm text-gray-400">
                  No active risk or withdrawal alerts.
                </p>
              )}
              <div className="space-y-3">
                {alerts.map((r) => (
                  <div key={r.animalId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-800">
                        {r.animalLabel}
                      </span>
                      <div className="flex gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${riskColor[r.riskLevel]}`}
                        >
                          {r.riskLevel}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${withdrawalColor[r.withdrawalStatus]}`}
                        >
                          {r.withdrawalStatus}
                        </span>
                      </div>
                    </div>
                    {r.reasons.length > 0 && (
                      <ul className="text-xs text-gray-500 list-disc list-inside">
                        {r.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-sm font-medium text-gray-900 mb-3">
            Notifications
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <div key={n._id} className="p-4">
                {n.title && (
                  <p className="text-sm text-gray-900 font-medium">{n.title}</p>
                )}
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
