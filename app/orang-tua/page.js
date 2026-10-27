
import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import DashboardView from "./DashboardView";
import "./dashboard.css";

export default function OrangTuaPage() {
  return (
    <Suspense
      fallback={
        <main className="ortu-dashboard">
          <div
            style={{
              margin: "auto",
              padding: "40px",
              textAlign: "center",
              color: "#8062d6",
            }}
          >
            Memuat dashboard orang tua...
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
