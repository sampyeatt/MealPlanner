import type { RefObject } from "react";
import type { IngredientDraft } from "../../types";
import { IngredientForm, IngredientRow } from "../molecules";

interface IngredientEditorProps {
  /** Ingredients to display, in order. */
  items: IngredientDraft[];
  /** Current value of the name / quantity / unit inputs (controlled). */
  name: string;
  qty: number | null;
  unit: string;
  /** Ref to the name input so the parent can refocus it after an add. */
  nameRef?: RefObject<HTMLInputElement>;
  onName: (value: string) => void;
  onQty: (value: number | null) => void;
  onUnit: (value: string) => void;
  /** The "+" button was pressed (the parent reads the current inputs). */
  onAdd: () => void;
  /** The delete button on the row at this index was pressed. */
  onRemove: (idx: number) => void;
}

/**
 * The ingredient list + inline "add" row, shared by the new-meal and
 * edit-meal modals so both look and behave identically: a list of
 * `IngredientRow`s plus an `IngredientForm` add row.
 */
export function IngredientEditor({
  items,
  name,
  qty,
  unit,
  nameRef,
  onName,
  onQty,
  onUnit,
  onAdd,
  onRemove,
}: IngredientEditorProps) {
  return (
    <>
      {items.length > 0 && (
        <div className="ingredient-list">
          {items.map((ing, idx) => (
            <IngredientRow
              key={idx}
              ingredient={ing}
              onRemove={() => onRemove(idx)}
            />
          ))}
        </div>
      )}

      <IngredientForm
        name={name}
        qty={qty}
        unit={unit}
        nameRef={nameRef}
        onName={onName}
        onQty={onQty}
        onUnit={onUnit}
        onAdd={onAdd}
      />
    </>
  );
}
