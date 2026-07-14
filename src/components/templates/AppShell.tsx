import type { ReactNode } from "react";

interface AppShellProps {
  /** The active page/view. */
  children: ReactNode;
  /** The persistent navigation, rendered below the scrolling content. */
  nav: ReactNode;
}

/** Top-level page frame: a scrolling content area above a fixed nav. */
export function AppShell({ children, nav }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-content">{children}</div>
      {nav}
    </div>
  );
}
