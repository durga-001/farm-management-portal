import { useState } from "react";
import { useData } from "../../context/DataContext";

export default function AdminVets() {
  const { vets, createVet } = useData();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    if (!form.name || !form.email || !form.password)
      return setError("Name, email and password are required.");
    try {
      await createVet(form);
      setForm({ name: "", email: "", password: "", phone: "" });
      setError("");
      setSuccess("Veterinarian account created.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Veterinarians
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 max-w-lg mb-8"
      >
        <h2 className="text-sm font-medium text-gray-900">Add veterinarian</h2>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            value={form.name}
            onChange={update("name")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            value={form.email}
            onChange={update("email")}
            type="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Password</label>
          <input
            value={form.password}
            onChange={update("password")}
            type="password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Phone (optional)
          </label>
          <input
            value={form.phone}
            onChange={update("phone")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <button
          type="submit"
          className="bg-amber-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-amber-700"
        >
          Create account
        </button>
      </form>

      <h2 className="text-sm font-medium text-gray-900 mb-3">
        All veterinarians
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Assigned farms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vets.map((v) => (
              <tr key={v._id}>
                <td className="px-4 py-2 text-gray-800">{v.name}</td>
                <td className="px-4 py-2 text-gray-600">{v.email}</td>
                <td className="px-4 py-2 text-gray-600">{v.phone || "—"}</td>
                <td className="px-4 py-2 text-gray-600">
                  {v.assignedFarmCount}
                </td>
              </tr>
            ))}
            {vets.length === 0 && (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-gray-400">
                  No veterinarians added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
