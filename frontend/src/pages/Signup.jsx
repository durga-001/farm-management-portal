import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", farmName: "", location: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v.trim())) return setError("Fill in every field.");
    try {
      await signup(form);
      navigate("/farmer/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Create your farmer account</h1>
        {[
          { key: "name", label: "Full name", type: "text" },
          { key: "farmName", label: "Farm name", type: "text" },
          { key: "location", label: "Location", type: "text" },
          { key: "email", label: "Email", type: "email" },
          { key: "password", label: "Password", type: "password" },
        ].map((f) => (
          <div key={f.key} className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
            <input value={form[f.key]} onChange={update(f.key)} type={f.type} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        ))}
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700">Sign up</button>
        <p className="text-sm text-gray-500 mt-4 text-center">Already have an account? <Link to="/login" className="text-green-700">Log in</Link></p>
      </form>
    </div>
  );
}
