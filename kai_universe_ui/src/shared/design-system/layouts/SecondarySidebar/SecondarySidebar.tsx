import { type ReactNode } from 'react';

import { ScrollArea } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

export interface SecondarySidebarProps {
  // Section title shown at the top (e.g., "Chats", "Discover", "Settings").
  readonly title: ReactNode;
  // Optional row of action buttons rendered to the right of the title.
  readonly headerActions?: ReactNode;
  // When supplied, replaces the entire title-bar row (used by chat to swap in
  // a search input). Title + headerActions are ignored while this is set.
  readonly headerOverride?: ReactNode;
  // Optional fixed sub-header rendered below the title (search input, filter
  // strip, etc.). Stays pinned while the body scrolls.
  readonly subHeader?: ReactNode;
  // Main scrollable body of the sidebar.
  readonly children: ReactNode;
  // Optional footer (action buttons, status, version pill).
  readonly footer?: ReactNode;
  readonly className?: string;
}

// Generic 260px contextual panel that sits between the PrimaryNavRail and the
// main content. Each feature contributes its own content via its layout. The
// shell controls visibility (selectSecondarySidebarHidden); when hidden, this
// component does not render and the feature's main content fills the space.
export function SecondarySidebar({
  title,
  headerActions,
  headerOverride,
  subHeader,
  children,
  footer,
  className,
}: SecondarySidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full min-w-0 flex-col border-r border-border-default bg-bg-surface',
        className,
      )}
    >
      <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border-default px-3">
        {headerOverride ?? (
          <>
            <h2 className="truncate text-xs font-semibold text-fg-default">{title}</h2>
            {headerActions && (
              <div className="flex shrink-0 items-center gap-1">{headerActions}</div>
            )}
          </>
        )}
      </header>
      {subHeader && <div className="shrink-0 px-2 py-2">{subHeader}</div>}
      <ScrollArea className="flex-1">{children}</ScrollArea>
      {footer && (
        <footer className="shrink-0 border-t border-border-default px-3 py-2 text-caption text-fg-muted">
          {footer}
        </footer>
      )}
    </aside>
  );
}
