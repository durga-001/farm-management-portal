import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { ANIMAL_TYPES, DOSAGE_UNITS } from "../../constants";

const EMPTY = {
  drugName: "",
  species: [],
  indication: "",
  dosageValue: "",
  dosageUnit: DOSAGE_UNITS[0],
  dosageRoute: "",
  frequency: "",
  durationDays: "",
  withdrawalPeriodDays: "",
  milkWithdrawalPeriodDays: "",
  mrlNotes: "",
  sourceTitle: "",
  sourceUrl: "",
};

export default function DrugReference() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () =>
    api
      .getDrugReferences()
      .then(setEntries)
      .catch(() => setEntries([]));
  useEffect(() => {
    load();
  }, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggleSpecies = (t) =>
    setForm((f) => ({
      ...f,
      species: f.species.includes(t)
        ? f.species.filter((s) => s !== t)
        : [...f.species, t],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    if (!form.drugName || !form.sourceTitle) {
      return setError(
        "Drug name and a source are required — this is the only place drug facts enter the system.",
      );
    }
    try {
      await api.addDrugReference({
        drugName: form.drugName,
        species: form.species,
        indication: form.indication,
        dosage: {
          value: form.dosageValue ? Number(form.dosageValue) : null,
          unit: form.dosageUnit,
          route: form.dosageRoute,
        },
        frequency: form.frequency,
        durationDays: form.durationDays || undefined,
        withdrawalPeriodDays: form.withdrawalPeriodDays || undefined,
        milkWithdrawalPeriodDays: form.milkWithdrawalPeriodDays || undefined,
        mrlNotes: form.mrlNotes,
        source: { title: form.sourceTitle, url: form.sourceUrl },
      });
      setForm(EMPTY);
      setError("");
      setSuccess("Reference entry added.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    await api.deleteDrugReference(id);
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Drug reference library
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Add sourced dosage, withdrawal, and MRL facts here. This is the only
        data the Research Assistant is allowed to answer from — every entry must
        carry a source and is attributed to you.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Drug name
            </label>
            <input
              value={form.drugName}
              onChange={update("drugName")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Indication
            </label>
            <input
              value={form.indication}
              onChange={update("indication")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Species</label>
          <div className="flex gap-2 flex-wrap">
            {ANIMAL_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => toggleSpecies(t)}
                className={`text-xs px-3 py-1.5 rounded-md border ${form.species.includes(t) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Dosage value
            </label>
            <input
              value={form.dosageValue}
              onChange={update("dosageValue")}
              type="number"
              step="any"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Unit</label>
            <select
              value={form.dosageUnit}
              onChange={update("dosageUnit")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {DOSAGE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Route</label>
            <input
              value={form.dosageRoute}
              onChange={update("dosageRoute")}
              placeholder="oral, IM, IV…"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Frequency
            </label>
            <input
              value={form.frequency}
              onChange={update("frequency")}
              placeholder="e.g. once daily"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Duration (days)
            </label>
            <input
              value={form.durationDays}
              onChange={update("durationDays")}
              type="number"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Withdrawal — meat (days)
            </label>
            <input
              value={form.withdrawalPeriodDays}
              onChange={update("withdrawalPeriodDays")}
              type="number"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Withdrawal — milk (days)
            </label>
            <input
              value={form.milkWithdrawalPeriodDays}
              onChange={update("milkWithdrawalPeriodDays")}
              type="number"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">MRL notes</label>
          <textarea
            value={form.mrlNotes}
            onChange={update("mrlNotes")}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Source title (required)
            </label>
            <input
              value={form.sourceTitle}
              onChange={update("sourceTitle")}
              placeholder="e.g. National MRL guideline, 2024"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Source URL (optional)
            </label>
            <input
              value={form.sourceUrl}
              onChange={update("sourceUrl")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Add reference entry
        </button>
      </form>

      <h2 className="text-sm font-medium text-gray-900 mb-3">
        Existing entries
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {entries.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No reference entries yet.</p>
        )}
        {entries.map((e) => (
          <div key={e._id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800 font-medium">{e.drugName}</p>
              <p className="text-xs text-gray-500">
                {e.source?.title} · added by {e.addedBy?.name || "vet"}
              </p>
            </div>
            <button
              onClick={() => handleDelete(e._id)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
