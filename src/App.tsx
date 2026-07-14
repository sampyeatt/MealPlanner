import { BottomNav } from "./components/organisms";
import { MealsPage, ShoppingPage, WeeklyPlannerPage } from "./components/pages";
import { AppShell } from "./components/templates";
import { useUiStore } from "./store/uiStore";

export default function App() {
  // Server state lives in TanStack Query caches read by each page; the active
  // tab is client UI state owned by the zustand store.
  const activeTab = useUiStore((s) => s.activeTab);

  return (
    <AppShell nav={<BottomNav />}>
      {activeTab === "meals" && <MealsPage />}
      {activeTab === "planner" && <WeeklyPlannerPage />}
      {activeTab === "shopping" && <ShoppingPage />}
    </AppShell>
  );
}
