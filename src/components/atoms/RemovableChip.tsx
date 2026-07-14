interface RemovableChipProps {
  /** Text shown in the chip. */
  label: string;
  /** Called when the chip's "✕" is pressed. */
  onRemove: () => void;
}

/** A small pill with a remove button — used for meals placed on a planner day. */
export function RemovableChip({ label, onRemove }: RemovableChipProps) {
  return (
    <div className="day-meal-chip">
      <span>{label}</span>
      <button className="chip-remove" onClick={onRemove}>
        {"✕"}
      </button>
    </div>
  );
}
