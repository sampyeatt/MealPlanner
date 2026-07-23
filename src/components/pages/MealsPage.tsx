import { useState } from "react";
import { Button } from "primereact/button";
import { ToggleButton } from "primereact/togglebutton";
import type { MealWithIngredients } from "../../types";
import {
  useAddToShoppingList,
  useDeleteMeal,
  useMeals,
} from "../../hooks/api";
import { useUiStore } from "../../store/uiStore";
import { EmptyState, StatusToast } from "../atoms";
import {
  CompactMealCard,
  CreateMealModal,
  EditMealModal,
  MealCard,
  ViewMealModal,
} from "../organisms";
import { ViewLayout } from "../templates";

type Modal =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; meal: MealWithIngredients }
  | { type: "view"; meal: MealWithIngredients };

/** The "My Meals" page: the meal grid plus the add/edit/view meal modals. */
export function MealsPage() {
  const { data: meals = [] } = useMeals();
  const deleteMeal = useDeleteMeal();
  const addToShoppingList = useAddToShoppingList();
  const [modal, setModal] = useState<Modal>({ type: "none" });
  const mealView = useUiStore((s) => s.mealView);
  const setMealView = useUiStore((s) => s.setMealView);
  const status = useUiStore((s) => s.status);
  const setStatus = useUiStore((s) => s.setStatus);
  const clearStatus = useUiStore((s) => s.clearStatus);

  const closeModal = () => setModal({ type: "none" });

  const onDelete = (id: number) =>
    deleteMeal.mutate(id, { onSuccess: () => setStatus("Meal deleted.") });

  const onAddToShopping = (mealId: number) =>
    addToShoppingList.mutate(mealId, {
      onSuccess: () => setStatus("Added to shopping list!"),
    });

  const compact = mealView === "compact";
  const Card = compact ? CompactMealCard : MealCard;

  const viewToggle = (
    <ToggleButton
      checked={compact}
      onChange={(e) => setMealView(e.value ? "compact" : "expanded")}
      onIcon="pi pi-th-large"
      offIcon="pi pi-bars"
      onLabel=""
      offLabel=""
      className="meal-view-toggle"
      aria-label="Toggle meal card size"
    />
  );

  return (
    <ViewLayout title="My Meals" actions={viewToggle}>
      {status !== null && (
        <StatusToast message={status} onDismiss={clearStatus} />
      )}

      {meals.length === 0 ? (
        <EmptyState message="No meals yet. Add your first meal!" />
      ) : (
        <div className={compact ? "meal-grid meal-grid-compact" : "meal-grid"}>
          {meals.map((meal) => (
            <Card
              key={meal.id}
              meal={meal}
              onDelete={onDelete}
              onView={(m) => setModal({ type: "view", meal: m })}
              onEdit={(m) => setModal({ type: "edit", meal: m })}
              onAddToShopping={onAddToShopping}
            />
          ))}
        </div>
      )}

      {/* Keeps the last card clear of the fixed add-meal bar below. */}
      <div className="add-meal-bar-spacer" />

      {/* Pinned above the bottom nav so "Add Meal" is always reachable. */}
      <div className="add-meal-bar">
        <Button
          label="Add Meal"
          icon="pi pi-plus"
          className="add-meal-btn"
          onClick={() => setModal({ type: "add" })}
        />
      </div>

      {modal.type === "add" && <CreateMealModal onClose={closeModal} />}
      {modal.type === "edit" && (
        <EditMealModal meal={modal.meal} onClose={closeModal} />
      )}
      {modal.type === "view" && (
        <ViewMealModal meal={modal.meal} onClose={closeModal} />
      )}
    </ViewLayout>
  );
}
