import type { Tab } from "../../types";
import { useUiStore } from "../../store/uiStore";

const TABS: { tab: Tab; icon: string; label: string }[] = [
  { tab: "meals", icon: "🍽", label: "Meals" },
  { tab: "planner", icon: "📅", label: "Planner" },
  { tab: "shopping", icon: "🛒", label: "Shopping" },
];

/** The fixed bottom tab bar that switches between the three top-level views. */
export function BottomNav() {
  const active = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  return (
    <nav className="bottom-nav">
      {TABS.map(({ tab, icon, label }) => (
        <button
          key={tab}
          className={`nav-tab${active === tab ? " active" : ""}`}
          onClick={() => setActiveTab(tab)}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
