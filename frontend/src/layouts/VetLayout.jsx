import { Outlet } from "react-router-dom";
import VetNavbar from "../components/VetNavbar";

export default function VetLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <VetNavbar />
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
