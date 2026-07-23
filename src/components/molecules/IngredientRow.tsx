import type { IngredientDraft } from "../../types";
import { IconButton } from "../atoms";

interface IngredientRowProps {
  /** The ingredient to display. */
  ingredient: IngredientDraft;
  /** Called when the row's remove button is pressed. Omit to hide the button. */
  onRemove?: () => void;
}

/** One read-only ingredient line (name + "qty unit") with a remove button. */
export function IngredientRow({ ingredient, onRemove }: IngredientRowProps) {
  return (
    <div className="ingredient-row">
      <span className="ing-name">{ingredient.name}</span>
      <span className="ing-qty">{`${ingredient.quantity} ${ingredient.unit}`}</span>
      {onRemove && (
        <div className="ing-actions">
          <IconButton
            icon="pi pi-trash"
            severity="danger"
            ariaLabel="Remove ingredient"
            onClick={onRemove}
          />
        </div>
      )}
    </div>
  );
}
