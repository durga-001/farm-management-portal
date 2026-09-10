import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${isActive ? "bg-blue-100 text-blue-800" : "text-gray-600 hover:bg-gray-100"}`;

export default function VetNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between overflow-x-auto">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-blue-700 mr-4">Vet Panel</span>
        <NavLink to="/vet/overview" className={linkClass}>
          Overview
        </NavLink>
        <NavLink to="/vet/farmers" className={linkClass}>
          My Farmers
        </NavLink>
        <NavLink to="/vet/assistant" className={linkClass}>
          Research Assistant
        </NavLink>
        <NavLink to="/vet/drug-reference" className={linkClass}>
          Drug Reference
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
        <NavLink to="/vet/risk-management" className={linkClass}>
          Risk Management
        </NavLink>
        <NavLink to="/vet/notifications" className={linkClass}>
          Notifications
        </NavLink>
      </div>
      <div className="flex items-center gap-4 shrink-0">
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
