
import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import "./tutor.css";

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <main className="tutor-loading">
          <div className="tutor-loading-card">
            <div className="tutor-loading-icon">M</div>
            <h2>Menyiapkan ruang mengajar...</h2>
            <p>Mohon tunggu sebentar.</p>
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
