import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import StatCard from "../components/StatCard";

export default function Landing() {
  const [locationStats, setLocationStats] = useState([]);
  const [publicStats, setPublicStats] = useState(null);

  useEffect(() => {
    api
      .getRegistrationStats()
      .then(setLocationStats)
      .catch(() => setLocationStats([]));
    api
      .getPublicStats()
      .then(setPublicStats)
      .catch(() => setPublicStats(null));
  }, []);

  const max = Math.max(1, ...locationStats.map((s) => s.count));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white">
        <span className="font-semibold text-green-700">Farm Ledger</span>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Digital farm management Portal for MRL and antimicrobial monitoring
        </h1>
        <p className="text-gray-600 mb-8">
          Farm Ledger connects farmers with assigned veterinarians to track
          treatments, monitor withdrawal periods, and catch unusual
          antimicrobial usage before it becomes a compliance risk.
        </p>
        <Link
          to="/signup"
          className="inline-block px-6 py-3 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
        >
          Register Now
        </Link>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Farms registered"
            value={publicStats ? publicStats.totalFarms : "—"}
          />
          <StatCard
            label="Veterinarians"
            value={publicStats ? publicStats.totalVets : "—"}
          />
          <StatCard
            label="Animals tracked"
            value={publicStats ? publicStats.totalAnimals : "—"}
          />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-medium text-gray-900 mb-6 text-center">
          What the platform does
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              For Farmers
            </h3>
            <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Register your farm and manage your animals in one place</li>
              <li>Log treatments and see withdrawal status per animal</li>
              <li>Get matched with an assigned veterinarian for guidance</li>
              <li>Receive notifications and compliance alerts directly</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              For Veterinarians
            </h3>
            <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Review treatment records across all assigned farms</li>
              <li>Run rule-based Data Diagnosis to catch incomplete records</li>
              <li>Spot unusual antimicrobial usage with AMU Diagnosis</li>
              <li>
                Send targeted notifications to one or all assigned farmers
              </li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              AMU monitoring
            </h3>
            <p className="text-sm text-gray-600">
              Antimicrobial usage is tracked per animal and per farm, surfacing
              repeated treatments, short intervals between doses, and rising
              usage trends using transparent, rule-based checks.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              MRL & withdrawal compliance
            </h3>
            <p className="text-sm text-gray-600">
              Every treatment with a recorded withdrawal period is checked
              against today's date to show a clear SAFE, ACTIVE, COMPLETED, or
              UNKNOWN status — never an invented value.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 md:col-span-2">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Data Diagnosis
            </h3>
            <p className="text-sm text-gray-600">
              A transparent, rule-based Data Quality Score (0–100) checks every
              treatment record for missing dosage, duration, treatment dates,
              prescriptions, and withdrawal information, plus duplicate or
              invalid entries — so veterinarians know exactly which records need
              attention.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Registered farmers by location
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          {locationStats.length === 0 && (
            <p className="text-sm text-gray-400">No farms registered yet.</p>
          )}
          {locationStats.map((s) => (
            <div key={s.location} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600 shrink-0 truncate">
                {s.location}
              </div>
              <div className="flex-1 bg-gray-100 rounded h-3">
                <div
                  className="bg-green-500 h-3 rounded"
                  style={{ width: `${(s.count / max) * 100}%` }}
                />
              </div>
              <div className="w-10 text-sm text-gray-700 text-right">
                {s.count}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
