import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-amber-100 text-amber-800" : "text-gray-600 hover:bg-gray-100"}`;

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-amber-700">Admin Panel</span>
        <NavLink to="/admin/overview" className={linkClass}>
          Overview
        </NavLink>
        <NavLink to="/admin/farms" className={linkClass}>
          Farms
        </NavLink>
        <NavLink to="/admin/vets" className={linkClass}>
          Veterinarians
        </NavLink>
        <NavLink to="/admin/risk-monitor" className={linkClass}>
          Risk monitor
        </NavLink>
        <NavLink to="/admin/notifications" className={linkClass}>
          Send notifications
        </NavLink>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
