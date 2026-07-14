import type { RefObject } from "react";
import { Button } from "primereact/button";
import { NumberInput, TextInput } from "../atoms";

interface IngredientFormProps {
  /** Controlled values of the name / quantity / unit inputs. */
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
}

/** The inline name/qty/unit entry row with a "+" button that stages an ingredient. */
export function IngredientForm({
  name,
  qty,
  unit,
  nameRef,
  onName,
  onQty,
  onUnit,
  onAdd,
}: IngredientFormProps) {
  return (
    <div className="ingredient-form-row">
      <TextInput
        ref={nameRef}
        className="ing-input-name"
        placeholder="Ingredient"
        value={name}
        onChange={(e) => onName(e.target.value)}
      />
      <NumberInput
        className="ing-input-qty"
        placeholder="Qty"
        value={qty}
        onValueChange={(e) => onQty(e.value ?? null)}
        minFractionDigits={0}
        maxFractionDigits={2}
      />
      <TextInput
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
  );
}
