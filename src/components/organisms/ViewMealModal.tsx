import { Dialog } from "primereact/dialog";
import type { IngredientDraft, MealWithIngredients } from "../../types";
import { useMeals } from "../../hooks/api";
import { IngredientEditor } from "./IngredientEditor";

/** Map a meal's saved ingredients onto the editor's id-less draft shape. */
function toDrafts(meal: MealWithIngredients): IngredientDraft[] {
  return meal.ingredients.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit: i.unit,
  }));
}

interface ViewMealModalProps {
  meal: MealWithIngredients;
  onClose: () => void;
}

/**
 * The read-only meal window: shows a meal's fields and its ingredients with no
 * editing affordances (use the edit modal for that). The meal is read live from
 * the meals cache so it reflects edits made elsewhere.
 */
export function ViewMealModal({ meal, onClose }: ViewMealModalProps) {
  const { data: meals } = useMeals();
  const current = meals?.find((m) => m.id === meal.id) ?? meal;

  return (
    <Dialog
      header={current.name}
      visible
      onHide={onClose}
      position="bottom"
      modal
      dismissableMask
      className="meal-dialog"
    >
      {current.description && <p className="meal-desc">{current.description}</p>}
      <h4>{"Ingredients"}</h4>
      {current.ingredients.length > 0 ? (
        <IngredientEditor items={toDrafts(current)} readOnly />
      ) : (
        <p className="empty-hint">{"No ingredients yet."}</p>
      )}
    </Dialog>
  );
}
