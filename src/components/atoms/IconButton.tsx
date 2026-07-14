import { Button } from "primereact/button";

interface IconButtonProps {
  /** PrimeIcons class, e.g. "pi pi-trash". */
  icon: string;
  /** Accessible name (also used as the tooltip when `tooltip` is omitted). */
  ariaLabel: string;
  onClick: () => void;
  /** Tooltip text; defaults to no tooltip. */
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  /** PrimeReact severity — e.g. "danger" for destructive actions. */
  severity?: "danger" | "secondary";
  /** Defaults to "button" so it never submits an enclosing form by accident. */
  type?: "button" | "submit";
  className?: string;
}

/**
 * The small, borderless, round icon-only action button used throughout the app
 * (row actions, card actions, chip removes). Wraps PrimeReact's `Button` so the
 * `text rounded` treatment lives in exactly one place.
 */
export function IconButton({
  icon,
  ariaLabel,
  onClick,
  tooltip,
  tooltipPosition = "bottom",
  severity,
  type = "button",
  className,
}: IconButtonProps) {
  return (
    <Button
      type={type}
      icon={icon}
      text
      rounded
      severity={severity}
      tooltip={tooltip}
      tooltipOptions={tooltip ? { position: tooltipPosition } : undefined}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
    />
  );
}
