import { Button } from "primereact/button";
import {
  useClearShoppingList,
  useRemoveFromShoppingList,
  useShoppingList,
  useToggleIngredientCheck,
} from "../../hooks/api";
import { EmptyState } from "../atoms";
import { ShoppingProgress } from "../molecules";
import { ShoppingSection } from "../organisms";
import { ViewLayout } from "../templates";

/** The shopping-list page: overall progress plus a section per meal. */
export function ShoppingPage() {
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
    <ViewLayout
      title="Shopping List"
      actions={
        shoppingList.length > 0 && (
          <Button
            label="Clear All"
            text
            severity="secondary"
            onClick={onClear}
          />
        )
      }
    >
      {shoppingList.length === 0 ? (
        <EmptyState
          message="Your shopping list is empty."
          hint='Go to Meals and tap "Add to Shopping List".'
        />
      ) : (
        <>
          <ShoppingProgress checked={checked} total={total} />

          <div className="shopping-sections">
            {shoppingList.map((entry) => (
              <ShoppingSection
                key={entry.meal_id}
                entry={entry}
                onToggle={onToggle}
                onRemoveMeal={onRemoveMeal}
              />
            ))}
          </div>
        </>
      )}
    </ViewLayout>
  );
}
