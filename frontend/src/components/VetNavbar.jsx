import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-blue-100 text-blue-800" : "text-gray-600 hover:bg-gray-100"}`;

export default function VetNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-blue-700">Vet Panel</span>
        <NavLink to="/vet/farmers" className={linkClass}>
          My Farmers
        </NavLink>
        <NavLink to="/vet/data-diagnosis" className={linkClass}>
          Data Diagnosis
        </NavLink>
        <NavLink to="/vet/amu-diagnosis" className={linkClass}>
          AMU Diagnosis
        </NavLink>
        <NavLink to="/vet/risk-compliance" className={linkClass}>
          Risk & Compliance
        </NavLink>
        <NavLink to="/vet/notifications" className={linkClass}>
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
