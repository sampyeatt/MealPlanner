interface EmptyStateProps {
  /** Primary message explaining that there's nothing to show. */
  message: string;
  /** Optional secondary hint telling the user how to add content. */
  hint?: string;
}

/** Centered placeholder shown when a collection (meals, shopping list) is empty. */
export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  );
}
