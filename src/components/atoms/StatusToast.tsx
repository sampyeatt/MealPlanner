interface StatusToastProps {
  /** The message to show. */
  message: string;
  /** Called when the toast is tapped, to dismiss it. */
  onDismiss: () => void;
}

/** Transient tap-to-dismiss status banner (e.g. "Meal created!"). */
export function StatusToast({ message, onDismiss }: StatusToastProps) {
  return (
    <div className="status-toast" onClick={onDismiss}>
      {message}
    </div>
  );
}
