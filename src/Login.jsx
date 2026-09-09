import { Link } from "react-router-dom";
import { stateRegistrations } from "../data/mockData";

export default function Landing() {
  const max = Math.max(...stateRegistrations.map((s) => s.count));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white">
        <span className="font-semibold text-green-700">Farm Ledger</span>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100">Login</Link>
          <Link to="/signup" className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700">Sign up</Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Digital farm management for MRL and antimicrobial monitoring
        </h1>
        <p className="text-gray-600 mb-8">
          Track treatments, monitor withdrawal periods, and catch unusual antimicrobial usage before it becomes a risk.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Registered farmers by state</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          {stateRegistrations.map((s) => (
            <div key={s.state} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600 shrink-0">{s.state}</div>
              <div className="flex-1 bg-gray-100 rounded h-3">
                <div className="bg-green-500 h-3 rounded" style={{ width: `${(s.count / max) * 100}%` }} />
              </div>
              <div className="w-10 text-sm text-gray-700 text-right">{s.count}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
