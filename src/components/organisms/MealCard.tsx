import { Button } from "primereact/button";
import type { MealWithIngredients } from "../../types";
import { IconButton, RecipeLink } from "../atoms";

interface MealCardProps {
  meal: MealWithIngredients;
  onDelete: (id: number) => void;
  onView: (meal: MealWithIngredients) => void;
  onEdit: (meal: MealWithIngredients) => void;
  onAddToShopping: (mealId: number) => void;
}

/** A meal summary card: name, actions, description, ingredient count, shop button. */
export function MealCard({
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
          <IconButton
            icon="pi pi-list"
            tooltip="View & Edit Ingredients"
            ariaLabel="View & Edit Ingredients"
            onClick={() => onView(meal)}
          />
          <IconButton
            icon="pi pi-pencil"
            tooltip="Edit Meal"
            ariaLabel="Edit Meal"
            onClick={() => onEdit(meal)}
          />
          <IconButton
            icon="pi pi-trash"
            severity="danger"
            tooltip="Delete"
            ariaLabel="Delete"
            onClick={() => onDelete(meal.id)}
          />
        </div>
      </div>
      {meal.description && <p className="meal-desc">{meal.description}</p>}
      {meal.recipe_url && (
        <div className="meal-recipe-link">
          <RecipeLink url={meal.recipe_url} label="View Recipe" />
        </div>
      )}
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
