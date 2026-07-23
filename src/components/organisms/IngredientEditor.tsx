import type { RefObject } from "react";
import type { IngredientDraft } from "../../types";
import { IngredientForm, IngredientRow } from "../molecules";

interface EditableProps {
  /** Show the add row and the per-row remove buttons (the default). */
  readOnly?: false;
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

interface ReadOnlyProps {
  /** Render just the list: no add row, no remove buttons. */
  readOnly: true;
}

type IngredientEditorProps = {
  /** Ingredients to display, in order. */
  items: IngredientDraft[];
} & (EditableProps | ReadOnlyProps);

/**
 * The ingredient list + inline "add" row, shared by the new-meal and
 * edit-meal modals so both look and behave identically: a list of
 * `IngredientRow`s plus an `IngredientForm` add row. In `readOnly` mode
 * (the view-meal modal) the editing affordances are left out entirely.
 */
export function IngredientEditor(props: IngredientEditorProps) {
  const { items } = props;
  const edit = props.readOnly ? null : props;

  return (
    <>
      {items.length > 0 && (
        <div className="ingredient-list">
          {items.map((ing, idx) => (
            <IngredientRow
              key={idx}
              ingredient={ing}
              onRemove={edit ? () => edit.onRemove(idx) : undefined}
            />
          ))}
        </div>
      )}

      {edit && (
        <IngredientForm
          name={edit.name}
          qty={edit.qty}
          unit={edit.unit}
          nameRef={edit.nameRef}
          onName={edit.onName}
          onQty={edit.onQty}
          onUnit={edit.onUnit}
          onAdd={edit.onAdd}
        />
      )}
    </>
  );
}
