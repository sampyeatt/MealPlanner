import { useState } from "react";
import { Button } from "primereact/button";
import type { MealWithIngredients } from "../../types";
import {
  useAddToShoppingList,
  useDeleteMeal,
  useMeals,
} from "../../hooks/api";
import { CreateMealModal } from "./CreateMealModal";
import { EditMealModal, ViewMealModal } from "./EditMealModal";

type Modal =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; meal: MealWithIngredients }
  | { type: "view"; meal: MealWithIngredients };

export function MealsView() {
  const { data: meals = [] } = useMeals();
  const deleteMeal = useDeleteMeal();
  const addToShoppingList = useAddToShoppingList();
  const [modal, setModal] = useState<Modal>({ type: "none" });
  const [status, setStatus] = useState<string | null>(null);

  const closeModal = () => setModal({ type: "none" });

  const onDelete = (id: number) =>
    deleteMeal.mutate(id, { onSuccess: () => setStatus("Meal deleted.") });

  const onAddToShopping = (mealId: number) =>
    addToShoppingList.mutate(mealId, {
      onSuccess: () => setStatus("Added to shopping list!"),
    });

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>{"My Meals"}</h2>
        <Button
          label="Add Meal"
          icon="pi pi-plus"
          onClick={() => setModal({ type: "add" })}
        />
      </div>

      {status !== null && (
        <div className="status-toast" onClick={() => setStatus(null)}>
          {status}
        </div>
      )}

      {meals.length === 0 ? (
        <div className="empty-state">
          <p>{"No meals yet. Add your first meal!"}</p>
        </div>
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

      {modal.type === "add" && (
        <CreateMealModal onClose={closeModal} onStatus={setStatus} />
      )}
      {modal.type === "edit" && (
        <EditMealModal meal={modal.meal} onClose={closeModal} />
      )}
      {modal.type === "view" && (
        <ViewMealModal meal={modal.meal} onClose={closeModal} />
      )}
    </div>
  );
}

interface MealCardProps {
  meal: MealWithIngredients;
  onDelete: (id: number) => void;
  onView: (meal: MealWithIngredients) => void;
  onEdit: (meal: MealWithIngredients) => void;
  onAddToShopping: (mealId: number) => void;
}

function MealCard({
  meal,
  onDelete,
  onView,
  onEdit,
  onAddToShopping,
}: MealCardProps) {
  const count = meal.ingredients.length;
  return (
    <div className="meal-card">
      <div className="meal-card-header">
        <h3>{meal.name}</h3>
        <div className="meal-card-actions">
          <Button
            icon="pi pi-list"
            text
            rounded
            tooltip="View & Edit Ingredients"
            tooltipOptions={{ position: "bottom" }}
            aria-label="View & Edit Ingredients"
            onClick={() => onView(meal)}
          />
          <Button
            icon="pi pi-pencil"
            text
            rounded
            tooltip="Edit Meal"
            tooltipOptions={{ position: "bottom" }}
            aria-label="Edit Meal"
            onClick={() => onEdit(meal)}
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            tooltip="Delete"
            tooltipOptions={{ position: "bottom" }}
            aria-label="Delete"
            onClick={() => onDelete(meal.id)}
          />
        </div>
      </div>
      {meal.description && <p className="meal-desc">{meal.description}</p>}
      <div className="meal-ingredients-summary">
        <span className="ingredient-count">
          {`${count} ingredient${count === 1 ? "" : "s"}`}
        </span>
      </div>
      <Button
        label="Add to Shopping List"
        icon="pi pi-shopping-cart"
        outlined
        className="btn-full"
        onClick={() => onAddToShopping(meal.id)}
      />
    </div>
  );
}
