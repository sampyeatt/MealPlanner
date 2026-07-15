import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import type { MealWithIngredients } from "../../types";

interface MealPickerProps {
  /** Meals to choose from. */
  meals: MealWithIngredients[];
  /** Currently selected meal id, or null when nothing is picked. */
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A meal dropdown with Cancel / Add actions, used to place a meal on a day. */
export function MealPicker({
  meals,
  selectedId,
  onSelect,
  onConfirm,
  onCancel,
}: MealPickerProps) {
  return (
    <div className="day-picker">
      <Dropdown
        value={selectedId}
        options={meals}
        optionLabel="name"
        optionValue="id"
        onChange={(e) => onSelect(e.value)}
        placeholder="-- Select meal --"
        className="picker-dropdown"
      />
      <div className="picker-actions">
        <Button
          label="Cancel"
          text
          severity="secondary"
          size="small"
          onClick={onCancel}
          className={'btn-actions'}
        />
        <Button label="Add" size="small" onClick={onConfirm} className={'btn-actions'} />
      </div>
    </div>
  );
}
