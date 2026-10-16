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

import VetLayout from "./layouts/VetLayout";
import VetOverview from "./pages/vet/Overview";
import VetFarmers from "./pages/vet/Farmers";
import DataDiagnosis from "./pages/vet/DataDiagnosis";
import AmuDiagnosis from "./pages/vet/AmuDiagnosis";
import RiskCompliance from "./pages/vet/RiskCompliance";
import VetRiskManagement from "./pages/vet/RiskManagement";
import VetAssistant from "./pages/vet/VetAssistant";
import DrugReference from "./pages/vet/DrugReference";
import VetNotifications from "./pages/vet/Notifications";
import AiRiskAnalysis from "./pages/vet/AiRiskAnalysis";

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
            path="/vet"
            element={
              <ProtectedRoute role="vet">
                <VetLayout />
              </ProtectedRoute>
            }
          >
            <Route path="overview" element={<VetOverview />} />
            <Route path="farmers" element={<VetFarmers />} />
            <Route path="assistant" element={<VetAssistant />} />
            <Route path="drug-reference" element={<DrugReference />} />
            <Route path="data-diagnosis" element={<DataDiagnosis />} />
            <Route path="amu-diagnosis" element={<AmuDiagnosis />} />
            <Route path="risk-compliance" element={<RiskCompliance />} />
            <Route path="risk-management" element={<VetRiskManagement />} />
            <Route path="ai-analysis" element={<AiRiskAnalysis />} />
            <Route path="notifications" element={<VetNotifications />} />
          </Route>
        </Routes>
      </DataProvider>
    </AuthProvider>
  );
}
