import { ProgressBar } from "primereact/progressbar";

interface ShoppingProgressProps {
  /** Number of checked-off items. */
  checked: number;
  /** Total number of items on the list. */
  total: number;
}

/** "checked / total items" caption above a progress bar. */
export function ShoppingProgress({ checked, total }: ShoppingProgressProps) {
  const value = total > 0 ? Math.floor((checked * 100) / total) : 0;
  return (
    <div className="shopping-progress">
      <div className="progress-text">{`${checked} / ${total} items`}</div>
      <ProgressBar value={value} showValue={false} />
    </div>
  );
}
