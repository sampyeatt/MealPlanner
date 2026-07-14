import { Checkbox } from "primereact/checkbox";
import type { ShoppingIngredient } from "../../types";

interface ShoppingItemProps {
  /** The shopping-list ingredient to render. */
  ingredient: ShoppingIngredient;
  /** Called when the checkbox is toggled. */
  onToggle: () => void;
}

/** A single checkable shopping-list line: checkbox + name and quantity. */
export function ShoppingItem({ ingredient, onToggle }: ShoppingItemProps) {
  return (
    <label className={`shopping-item${ingredient.checked ? " checked" : ""}`}>
      <Checkbox checked={ingredient.checked} onChange={onToggle} />
      <span className="item-text">
        <span className="item-name">{ingredient.name}</span>
        <span className="item-qty">
          {`${ingredient.quantity} ${ingredient.unit}`}
        </span>
      </span>
    </label>
  );
}
