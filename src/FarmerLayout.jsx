export default function StatCard({ label, value, tone = "default" }) {
  const tones = {
    default: "text-gray-900",
    danger: "text-red-600",
    warn: "text-amber-600",
    ok: "text-green-600",
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[140px]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
}
