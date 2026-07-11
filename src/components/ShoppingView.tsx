import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { ProgressBar } from "primereact/progressbar";
import {
  useClearShoppingList,
  useRemoveFromShoppingList,
  useShoppingList,
  useToggleIngredientCheck,
} from "../hooks/api";

export function ShoppingView() {
  const { data: shoppingList = [] } = useShoppingList();
  const toggleIngredientCheck = useToggleIngredientCheck();
  const removeFromShoppingList = useRemoveFromShoppingList();
  const clearShoppingList = useClearShoppingList();

  const onToggle = (ingredientId: number) =>
    toggleIngredientCheck.mutate(ingredientId);

  const onRemoveMeal = (mealId: number) =>
    removeFromShoppingList.mutate(mealId);

  const onClear = () => clearShoppingList.mutate();

  const total = shoppingList.reduce((s, e) => s + e.ingredients.length, 0);
  const checked = shoppingList.reduce(
    (s, e) => s + e.ingredients.filter((i) => i.checked).length,
    0,
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>{"Shopping List"}</h2>
        {shoppingList.length > 0 && (
          <Button
            label="Clear All"
            text
            severity="secondary"
            onClick={onClear}
          />
        )}
      </div>

      {shoppingList.length === 0 ? (
        <div className="empty-state">
          <p>{"Your shopping list is empty."}</p>
          <p className="empty-hint">
            {'Go to Meals and tap "Add to Shopping List".'}
          </p>
        </div>
      ) : (
        <>
          <div className="shopping-progress">
            <div className="progress-text">{`${checked} / ${total} items`}</div>
            <ProgressBar
              value={total > 0 ? Math.floor((checked * 100) / total) : 0}
              showValue={false}
            />
          </div>

          <div className="shopping-sections">
            {shoppingList.map((entry) => {
              const allChecked = entry.ingredients.every((i) => i.checked);
              return (
                <div
                  className={`shopping-section${allChecked ? " all-checked" : ""}`}
                  key={entry.meal_id}
                >
                  <div className="shopping-section-header">
                    <h3>{entry.meal_name}</h3>
                    <Button
                      icon="pi pi-times"
                      text
                      rounded
                      severity="danger"
                      aria-label="Remove meal from list"
                      onClick={() => onRemoveMeal(entry.meal_id)}
                    />
                  </div>
                  <div className="shopping-items">
                    {entry.ingredients.map((ing) => (
                      <label
                        className={`shopping-item${ing.checked ? " checked" : ""}`}
                        key={ing.ingredient_id}
                      >
                        <Checkbox
                          checked={ing.checked}
                          onChange={() => onToggle(ing.ingredient_id)}
                        />
                        <span className="item-text">
                          <span className="item-name">{ing.name}</span>
                          <span className="item-qty">
                            {`${ing.quantity} ${ing.unit}`}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
