import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [role, setRole] = useState("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Enter your email and password.");
    try {
      const user = await login(role, email, password);
      navigate(user.role === "admin" ? "/admin/overview" : "/farmer/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Log in</h1>
        <div className="flex gap-2 mb-5">
          <button type="button" onClick={() => setRole("farmer")}
            className={`flex-1 py-2 text-sm rounded-md border ${role === "farmer" ? "bg-green-600 text-white border-green-600" : "border-gray-300 text-gray-600"}`}>Farmer</button>
          <button type="button" onClick={() => setRole("admin")}
            className={`flex-1 py-2 text-sm rounded-md border ${role === "admin" ? "bg-amber-600 text-white border-amber-600" : "border-gray-300 text-gray-600"}`}>Admin</button>
        </div>
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-sm" placeholder="name@example.com" />
        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-sm" placeholder="••••••••" />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button type="submit" className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800">Log in</button>
        {role === "farmer" && (
          <p className="text-sm text-gray-500 mt-4 text-center">No account? <Link to="/signup" className="text-green-700">Sign up</Link></p>
        )}
      </form>
    </div>
  );
}
