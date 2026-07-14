import { useState } from "react";
import type { MealWithIngredients, WeekPlanEntry } from "../../types";
import { IconButton, RemovableChip } from "../atoms";
import { MealPicker } from "../molecules";

interface DayCardProps {
  day: number;
  dayName: string;
  entries: WeekPlanEntry[];
  meals: MealWithIngredients[];
  onAdd: (mealId: number, day: number) => void;
  onRemove: (id: number) => void;
}

/** One day column in the weekly planner: its meals plus an inline meal picker. */
export function DayCard({
  day,
  dayName,
  entries,
  meals,
  onAdd,
  onRemove,
}: DayCardProps) {
  const [picking, setPicking] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const openPicker = () => {
    setSelectedId(null);
    setPicking(true);
  };

  const confirmPick = () => {
    if (selectedId != null && selectedId > 0) {
      onAdd(selectedId, day);
      setPicking(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="day-card">
      <div className="day-header">
        <span className="day-name">{dayName}</span>
        <IconButton
          icon="pi pi-plus"
          ariaLabel="Add meal to day"
          onClick={openPicker}
        />
      </div>
      <div className="day-meals">
        {entries.map((entry) => (
          <RemovableChip
            key={entry.id}
            label={entry.meal_name}
            onRemove={() => onRemove(entry.id)}
          />
        ))}
      </div>
      {picking && (
        <MealPicker
          meals={meals}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onConfirm={confirmPick}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}
