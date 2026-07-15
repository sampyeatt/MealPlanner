import { useState } from "react";
import { Button } from "primereact/button";
import type { MealWithIngredients } from "../../types";
import {
  useAddToShoppingList,
  useDeleteMeal,
  useMeals,
} from "../../hooks/api";
import { useUiStore } from "../../store/uiStore";
import { EmptyState, StatusToast } from "../atoms";
import {
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

  return (
    <ViewLayout title="My Meals">
      {status !== null && (
        <StatusToast message={status} onDismiss={clearStatus} />
      )}

      {meals.length === 0 ? (
        <EmptyState message="No meals yet. Add your first meal!" />
      ) : (
        <div className="meal-grid">
          {meals.map((meal) => (
            <MealCard
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
