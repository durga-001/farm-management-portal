import { useState } from "react";
import { useData } from "../../context/DataContext";
import AIChat from "../../components/AIChat";

export default function DiseaseSearch() {
  const { farms } = useData();
  const [farmId, setFarmId] = useState("");
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Disease search (AI)
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Search symptoms or diseases. Optionally include a farm's records.
      </p>
      <select
        value={farmId}
        onChange={(e) => setFarmId(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
      >
        <option value="">General search (no farm)</option>
        {farms.map((f) => (
          <option key={f._id} value={f._id}>
            {f.name}
          </option>
        ))}
      </select>
      <AIChat
        placeholder="e.g. blisters on feet and mouth in cattle"
        farmId={farmId}
      />
    </div>
  );
}
