import { useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import type { MealWithIngredients, WeekPlanEntry } from "../types";
import { DAYS } from "../types";
import {
  useAddToWeekPlan,
  useMeals,
  useRemoveFromWeekPlan,
  useWeekPlan,
} from "../hooks/api";

export function WeeklyPlannerView() {
  const { data: meals = [] } = useMeals();
  const { data: weekPlan = [] } = useWeekPlan();
  const addToWeekPlan = useAddToWeekPlan();
  const removeFromWeekPlan = useRemoveFromWeekPlan();

  const onRemove = (id: number) => removeFromWeekPlan.mutate(id);

  const onAdd = (mealId: number, day: number) =>
    addToWeekPlan.mutate({ mealId, dayOfWeek: day });

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>{"Weekly Planner"}</h2>
      </div>
      <div className="week-grid">
        {Array.from({ length: 7 }, (_, day) => (
          <DayCard
            key={day}
            day={day}
            dayName={DAYS[day]}
            entries={weekPlan.filter((e) => e.day_of_week === day)}
            meals={meals}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

interface DayCardProps {
  day: number;
  dayName: string;
  entries: WeekPlanEntry[];
  meals: MealWithIngredients[];
  onAdd: (mealId: number, day: number) => void;
  onRemove: (id: number) => void;
}

function DayCard({
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
        <Button
          icon="pi pi-plus"
          text
          rounded
          aria-label="Add meal to day"
          onClick={openPicker}
        />
      </div>
      <div className="day-meals">
        {entries.map((entry) => (
          <div className="day-meal-chip" key={entry.id}>
            <span>{entry.meal_name}</span>
            <button className="chip-remove" onClick={() => onRemove(entry.id)}>
              {"✕"}
            </button>
          </div>
        ))}
      </div>
      {picking && (
        <div className="day-picker">
          <Dropdown
            value={selectedId}
            options={meals}
            optionLabel="name"
            optionValue="id"
            onChange={(e) => setSelectedId(e.value)}
            placeholder="-- Select meal --"
          />
          <div className="picker-actions">
            <Button
              label="Cancel"
              text
              severity="secondary"
              size="small"
              onClick={() => setPicking(false)}
            />
            <Button label="Add" size="small" onClick={confirmPick} />
          </div>
        </div>
      )}
    </div>
  );
}
