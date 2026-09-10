import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FARMER_FIELDS = [
  { key: "name", label: "Full name", type: "text" },
  { key: "farmName", label: "Farm name", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "password", label: "Password", type: "password" },
];

const VET_FIELDS = [
  { key: "name", label: "Full name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "password", label: "Password", type: "password" },
  { key: "phone", label: "Phone (optional)", type: "text", optional: true },
  {
    key: "licenseNumber",
    label: "License number (optional)",
    type: "text",
    optional: true,
  },
];

export default function Signup() {
  const [role, setRole] = useState("farmer");
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const fields = role === "vet" ? VET_FIELDS : FARMER_FIELDS;

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleRoleChange = (r) => {
    setRole(r);
    setForm({});
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredKeys = fields.filter((f) => !f.optional).map((f) => f.key);
    if (requiredKeys.some((k) => !form[k] || !String(form[k]).trim())) {
      return setError("Fill in every required field.");
    }
    try {
      await signup({ ...form, role });
      navigate(role === "vet" ? "/vet/overview" : "/farmer/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          Create your account
        </h1>

        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => handleRoleChange("farmer")}
            className={`flex-1 py-2 text-sm rounded-md border ${role === "farmer" ? "bg-green-600 text-white border-green-600" : "border-gray-300 text-gray-600"}`}
          >
            Farmer
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("vet")}
            className={`flex-1 py-2 text-sm rounded-md border ${role === "vet" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600"}`}
          >
            Veterinarian
          </button>
        </div>

        {fields.map((f) => (
          <div key={f.key} className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              {f.label}
            </label>
            <input
              value={form[f.key] || ""}
              onChange={update(f.key)}
              type={f.type}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        ))}

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          type="submit"
          className={`w-full text-white rounded-md py-2 text-sm font-medium ${role === "vet" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
        >
          Sign up
        </button>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-green-700">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
