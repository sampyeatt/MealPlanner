import { useState } from "react";
import { Nav } from "./components/Nav";
import { MealsView } from "./components/meals/MealsView";
import { WeeklyPlannerView } from "./components/WeeklyPlannerView";
import { ShoppingView } from "./components/ShoppingView";
import type { Tab } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("meals");

  // Server state now lives in TanStack Query caches read by each view, so App
  // only owns which tab is showing.
  return (
    <div className="app-shell">
      <div className="app-content">
        {activeTab === "meals" && <MealsView />}
        {activeTab === "planner" && <WeeklyPlannerView />}
        {activeTab === "shopping" && <ShoppingView />}
      </div>
      <Nav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
