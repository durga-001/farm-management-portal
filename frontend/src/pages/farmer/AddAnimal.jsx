import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { ANIMAL_TYPES } from "../../constants";
import { api } from "../../services/api";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddAnimal() {
  const { addAnimal } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    animalId: "",
    type: ANIMAL_TYPES[0],
    ageMonths: "",
    weight: "",
  });
  const [error, setError] = useState("");

  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiMessage, setAiMessage] = useState("");
  const [aiConfirmed, setAiConfirmed] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files?.[0] || null);
    setAiSuggestion(null);
    setAiMessage("");
    setAiConfirmed(false);
  };

  const handleScan = async () => {
    if (!photo) return;
    setScanning(true);
    setAiMessage("");
    try {
      const base64 = await fileToBase64(photo);
      const res = await api.aiDraftAnimal(base64, photo.type);
      if (!res.available) {
        setAiMessage(res.message);
        setAiSuggestion(null);
      } else {
        setAiSuggestion(res.suggestion);
        setAiMessage(res.disclaimer);
        if (res.suggestion.type && ANIMAL_TYPES.includes(res.suggestion.type)) {
          setForm((f) => ({ ...f, type: res.suggestion.type }));
        }
      }
    } catch (err) {
      setAiMessage(
        "Could not analyze the photo. Please enter details manually.",
      );
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.animalId || !form.ageMonths || !form.weight)
      return setError("Fill in every field.");
    if (aiSuggestion && !aiConfirmed) {
      return setError(
        "Please confirm the AI suggestion (or ignore it) before saving.",
      );
    }
    try {
      await addAnimal({
        ...form,
        ageMonths: Number(form.ageMonths),
        weight: Number(form.weight),
        registrationMethod: aiSuggestion ? "ai_assisted" : "manual",
        aiSuggestion: aiSuggestion
          ? {
              breedGuess: aiSuggestion.breedGuess,
              confidence: aiSuggestion.confidence,
              notes: aiSuggestion.notes,
              farmerConfirmed: true,
            }
          : undefined,
      });
      navigate("/farmer/animals");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Add animal</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <label className="block text-sm text-gray-600 mb-1">
          Scan animal photo (optional, AI-assisted)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="w-full text-sm mb-3"
        />
        <button
          type="button"
          onClick={handleScan}
          disabled={!photo || scanning}
          className="text-sm px-3 py-1.5 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          {scanning ? "Analyzing…" : "Analyze photo"}
        </button>

        {aiMessage && <p className="text-xs text-gray-500 mt-3">{aiMessage}</p>}

        {aiSuggestion && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">
              AI suggestion — type: {aiSuggestion.type || "uncertain"}
              {aiSuggestion.breedGuess
                ? `, breed guess: ${aiSuggestion.breedGuess}`
                : ""}
              {aiSuggestion.confidence != null
                ? ` (confidence ${aiSuggestion.confidence}%)`
                : ""}
            </p>
            {aiSuggestion.notes && <p className="mb-2">{aiSuggestion.notes}</p>}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={aiConfirmed}
                onChange={(e) => setAiConfirmed(e.target.checked)}
              />
              I reviewed this suggestion and confirm the details below are
              correct.
            </label>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <div>
          <label className="block text-sm text-gray-600 mb-1">Animal ID</label>
          <input
            value={form.animalId}
            onChange={update("animalId")}
            placeholder="AN-1006"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type</label>
          <select
            value={form.type}
            onChange={update("type")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {ANIMAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Age (months)
          </label>
          <input
            value={form.ageMonths}
            onChange={update("ageMonths")}
            type="number"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Weight (kg)
          </label>
          <input
            value={form.weight}
            onChange={update("weight")}
            type="number"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700"
        >
          Save animal
        </button>
      </form>
    </div>
  );
}
