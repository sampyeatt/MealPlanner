import type { Tab } from "../types";

const TABS: { tab: Tab; icon: string; label: string }[] = [
  { tab: "meals", icon: "🍽", label: "Meals" },
  { tab: "planner", icon: "📅", label: "Planner" },
  { tab: "shopping", icon: "🛒", label: "Shopping" },
];

interface NavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function Nav({ active, onChange }: NavProps) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ tab, icon, label }) => (
        <button
          key={tab}
          className={`nav-tab${active === tab ? " active" : ""}`}
          onClick={() => onChange(tab)}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
