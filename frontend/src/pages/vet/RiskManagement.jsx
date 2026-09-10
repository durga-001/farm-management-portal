import { useData } from "../../context/DataContext";

const statusColor = {
  safe: "text-green-700 bg-green-50",
  withdrawal: "text-amber-700 bg-amber-50",
  unsafe: "text-red-700 bg-red-50",
};

export default function VetRiskManagement() {
  const { animals, farms, setAnimalStatus, vetSendNotification } = useData();
  const flagged = animals.filter((a) => a.status !== "safe");
  const farmName = (id) => farms.find((f) => f._id === id)?.name || "Farm";

  const markSafe = async (a) => {
    await setAnimalStatus(a._id, "safe");
    await vetSendNotification(
      a.farm?._id || a.farm,
      `${a.animalId} has been marked safe after review.`,
    );
  };
  const markUnsafe = async (a) => {
    await setAnimalStatus(a._id, "unsafe");
    await vetSendNotification(
      a.farm?._id || a.farm,
      `${a.animalId} has been flagged unsafe. Please review treatment history.`,
    );
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Risk management
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Review flagged animals across your assigned farms and confirm their
        status. This vet decision is final — it is never set automatically.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {flagged.length === 0 && (
          <p className="p-4 text-sm text-gray-500">
            Nothing flagged right now.
          </p>
        )}
        {flagged.map((a) => (
          <div key={a._id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">
                {a.animalId} · {a.type} · {farmName(a.farm?._id || a.farm)}
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor[a.status]}`}
              >
                {a.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => markSafe(a)}
                className="text-xs px-3 py-1.5 rounded-md border border-green-300 text-green-700 hover:bg-green-50"
              >
                Mark safe
              </button>
              <button
                onClick={() => markUnsafe(a)}
                className="text-xs px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
              >
                Mark unsafe
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
