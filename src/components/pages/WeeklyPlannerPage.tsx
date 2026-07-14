import { DAYS } from "../../types";
import {
  useAddToWeekPlan,
  useMeals,
  useRemoveFromWeekPlan,
  useWeekPlan,
} from "../../hooks/api";
import { DayCard } from "../organisms";
import { ViewLayout } from "../templates";

/** The weekly planner page: a grid of seven day columns. */
export function WeeklyPlannerPage() {
  const { data: meals = [] } = useMeals();
  const { data: weekPlan = [] } = useWeekPlan();
  const addToWeekPlan = useAddToWeekPlan();
  const removeFromWeekPlan = useRemoveFromWeekPlan();

  const onRemove = (id: number) => removeFromWeekPlan.mutate(id);

  const onAdd = (mealId: number, day: number) =>
    addToWeekPlan.mutate({ mealId, dayOfWeek: day });

  return (
    <ViewLayout title="Weekly Planner">
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
    </ViewLayout>
  );
}
