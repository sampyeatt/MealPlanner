import type { ReactNode } from "react";

interface ViewLayoutProps {
  /** Heading shown at the top of the view. */
  title: string;
  /** Optional header-right actions (buttons). */
  actions?: ReactNode;
  /** The view's body. */
  children: ReactNode;
}

/** Shared page scaffold: a titled header row with optional actions, then body. */
export function ViewLayout({ title, actions, children }: ViewLayoutProps) {
  return (
    <div className="view-container">
      <div className="view-header">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}
