import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-green-100 text-green-800" : "text-gray-600 hover:bg-gray-100"}`;

export default function FarmerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-green-700">Farm Ledger</span>
          <NavLink to="/farmer/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/farmer/animals" className={linkClass}>Animals</NavLink>
          <NavLink to="/farmer/add-animal" className={linkClass}>Add animal</NavLink>
          <NavLink to="/farmer/add-medicine" className={linkClass}>Add medicine</NavLink>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.farmName}</span>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
