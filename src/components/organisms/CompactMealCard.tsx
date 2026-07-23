import type { MealWithIngredients } from "../../types";
import { IconButton } from "../atoms";

interface CompactMealCardProps {
  meal: MealWithIngredients;
  onDelete: (id: number) => void;
  onView: (meal: MealWithIngredients) => void;
  onEdit: (meal: MealWithIngredients) => void;
  onAddToShopping: (mealId: number) => void;
}

/**
 * The compact-view meal card: just the name and the four actions, sized to sit
 * two-per-row. Everything else `MealCard` shows (description, recipe link,
 * ingredient count) is reachable through the view action.
 */
export function CompactMealCard({
  meal,
  onDelete,
  onView,
  onEdit,
  onAddToShopping,
}: CompactMealCardProps) {
  return (
    <div className="meal-card meal-card-compact">
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
          icon="pi pi-shopping-cart"
          tooltip="Add to Shopping List"
          ariaLabel="Add to Shopping List"
          onClick={() => onAddToShopping(meal.id)}
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
  );
}
