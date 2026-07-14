import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import type { IngredientDraft, MealWithIngredients } from "../../types";
import {
  useAddIngredient,
  useDeleteIngredient,
  useMeals,
} from "../../hooks/api";
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
 * The "View & Edit Ingredients" window: shows a meal read-only but lets the
 * user add/remove ingredients (each change persists immediately). The meal is
 * read live from the meals cache so it reflects each mutation. The add-row is
 * transient scratch state, so it uses plain local state rather than a form.
 */
export function ViewMealModal({ meal, onClose }: ViewMealModalProps) {
  const { data: meals } = useMeals();
  const current = meals?.find((m) => m.id === meal.id) ?? meal;
  const addIngredient = useAddIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [name, setName] = useState("");
  const [qty, setQty] = useState<number | null>(1);
  const [unit, setUnit] = useState("cups");
  const nameRef = useRef<HTMLInputElement>(null);

  const onAddIng = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addIngredient.mutate(
      { mealId: meal.id, name: trimmed, quantity: qty ?? 1, unit },
      {
        onSuccess: () => {
          setName("");
          setQty(1);
          nameRef.current?.focus();
        },
      },
    );
  };

  const onRemoveIng = (idx: number) => {
    const ing = current.ingredients[idx];
    if (!ing) return;
    deleteIngredient.mutate(ing.id);
  };

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
      <IngredientEditor
        items={toDrafts(current)}
        name={name}
        qty={qty}
        unit={unit}
        nameRef={nameRef}
        onName={setName}
        onQty={setQty}
        onUnit={setUnit}
        onAdd={onAddIng}
        onRemove={onRemoveIng}
      />
    </Dialog>
  );
}
