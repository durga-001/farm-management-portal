import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import FarmerLayout from "./layouts/FarmerLayout";
import FarmerDashboard from "./pages/farmer/Dashboard";
import Animals from "./pages/farmer/Animals";
import AddAnimal from "./pages/farmer/AddAnimal";
import AddMedicine from "./pages/farmer/AddMedicine";

import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import Farms from "./pages/admin/Farms";
import RiskMonitor from "./pages/admin/RiskMonitor";
import AdminNotifications from "./pages/admin/Notifications";
import AdminVets from "./pages/admin/Vets";

import VetLayout from "./layouts/VetLayout";
import VetFarmers from "./pages/vet/Farmers";
import DataDiagnosis from "./pages/vet/DataDiagnosis";
import AmuDiagnosis from "./pages/vet/AmuDiagnosis";
import RiskCompliance from "./pages/vet/RiskCompliance";
import VetNotifications from "./pages/vet/Notifications";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/farmer"
            element={
              <ProtectedRoute role="farmer">
                <FarmerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="animals" element={<Animals />} />
            <Route path="add-animal" element={<AddAnimal />} />
            <Route path="add-medicine" element={<AddMedicine />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="overview" element={<AdminOverview />} />
            <Route path="farms" element={<Farms />} />
            <Route path="vets" element={<AdminVets />} />
            <Route path="risk-monitor" element={<RiskMonitor />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          <Route
            path="/vet"
            element={
              <ProtectedRoute role="vet">
                <VetLayout />
              </ProtectedRoute>
            }
          >
            <Route path="farmers" element={<VetFarmers />} />
            <Route path="data-diagnosis" element={<DataDiagnosis />} />
            <Route path="amu-diagnosis" element={<AmuDiagnosis />} />
            <Route path="risk-compliance" element={<RiskCompliance />} />
            <Route path="notifications" element={<VetNotifications />} />
          </Route>
        </Routes>
      </DataProvider>
    </AuthProvider>
  );
}
