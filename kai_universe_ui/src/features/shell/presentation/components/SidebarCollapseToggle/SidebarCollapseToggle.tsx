import { Sidebar, SidebarSimple } from '@phosphor-icons/react';

import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectSecondarySidebarHidden } from '../../store/selectors';
import { secondarySidebarToggled } from '../../store/slice';

// LMS-SHELL-003 — Sidebar Collapse Toggle.
// Toggles visibility of the secondary contextual sidebar (the wider panel
// next to the primary icon rail). The rail itself is always visible.
// UX-SHELL-008: tooltip surfaces the global ⌘\ shortcut.
export function SidebarCollapseToggle() {
  const hidden = useAppSelector(selectSecondarySidebarHidden);
  const dispatch = useAppDispatch();
  const label = hidden ? 'Show sidebar' : 'Hide sidebar';
  const tooltip = `${label} (⌘\\)`;

  return (
    <Tooltip content={tooltip} side="bottom">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={() => dispatch(secondarySidebarToggled())}
        aria-label={label}
        aria-keyshortcuts="Meta+\"
      >
        <Icon icon={hidden ? Sidebar : SidebarSimple} size="md" />
      </Button>
    </Tooltip>
  );
}
