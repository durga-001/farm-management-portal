import { Outlet } from "react-router-dom";
import FarmerNavbar from "../components/FarmerNavbar";

export default function FarmerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FarmerNavbar />
      <main className="p-6 max-w-6xl mx-auto"><Outlet /></main>
    </div>
  );
}
