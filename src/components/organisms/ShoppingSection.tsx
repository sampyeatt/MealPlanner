import type { ShoppingListEntry } from "../../types";
import { IconButton } from "../atoms";
import { ShoppingItem } from "../molecules";

interface ShoppingSectionProps {
  /** One meal's block of shopping-list ingredients. */
  entry: ShoppingListEntry;
  onToggle: (ingredientId: number) => void;
  onRemoveMeal: (mealId: number) => void;
}

/** A per-meal shopping-list section: header with remove button + its items. */
export function ShoppingSection({
  entry,
  onToggle,
  onRemoveMeal,
}: ShoppingSectionProps) {
  const allChecked = entry.ingredients.every((i) => i.checked);
  return (
    <div className={`shopping-section${allChecked ? " all-checked" : ""}`}>
      <div className="shopping-section-header">
        <h3>{entry.meal_name}</h3>
        <IconButton
          icon="pi pi-times"
          severity="danger"
          ariaLabel="Remove meal from list"
          onClick={() => onRemoveMeal(entry.meal_id)}
        />
      </div>
      <div className="shopping-items">
        {entry.ingredients.map((ing) => (
          <ShoppingItem
            key={ing.ingredient_id}
            ingredient={ing}
            onToggle={() => onToggle(ing.ingredient_id)}
          />
        ))}
      </div>
    </div>
  );
}
