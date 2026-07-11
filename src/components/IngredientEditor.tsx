import type { RefObject } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import type { IngredientDraft } from "../types";

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
 * edit-meal modals so both look and behave identically: a list of rows each
 * with a delete button, and a name/qty/unit row with a "+" button.
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
            <div className="ingredient-row" key={idx}>
              <span className="ing-name">{ing.name}</span>
              <span className="ing-qty">{`${ing.quantity} ${ing.unit}`}</span>
              <div className="ing-actions">
                <Button
                  type="button"
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Remove ingredient"
                  onClick={() => onRemove(idx)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ingredient-form-row">
        <InputText
          ref={nameRef}
          className="ing-input-name"
          placeholder="Ingredient"
          value={name}
          onChange={(e) => onName(e.target.value)}
        />
        <InputNumber
          className="ing-input-qty"
          placeholder="Qty"
          value={qty}
          onValueChange={(e) => onQty(e.value ?? null)}
          minFractionDigits={0}
          maxFractionDigits={2}
        />
        <InputText
          className="ing-input-unit"
          placeholder="Unit"
          value={unit}
          onChange={(e) => onUnit(e.target.value)}
        />
        <Button
          type="button"
          icon="pi pi-plus"
          className="btn-add-ing"
          aria-label="Add ingredient"
          onClick={onAdd}
        />
      </div>
    </>
  );
}
