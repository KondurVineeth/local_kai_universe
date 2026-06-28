import { Sidebar, SidebarSimple } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';

import { selectOnboardingMode } from '@features/onboarding';
import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { routeHasNoRightPanel } from '../../routing/routePanels';
import { selectRightPanelOpen } from '../../store/selectors';
import { rightPanelToggled } from '../../store/slice';

// LMS-SHELL-007 — Right Panel Toggle.
// UX-SHELL-008: tooltip surfaces the global ⌘. shortcut.
//
// Hidden in User mode — the right panel itself is hidden in that mode (see
// AppShellLayout), so a toggle for it would be misleading chrome. The user's
// path to the panel in User mode is: open Settings → switch to Developer.
// The mode chip in the top header makes that path discoverable.
export function RightPanelToggle() {
  const open = useAppSelector(selectRightPanelOpen);
  const mode = useAppSelector(selectOnboardingMode);
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  if (mode === 'user') return null;
  if (routeHasNoRightPanel(pathname)) return null;

  const label = open ? 'Hide right panel' : 'Show right panel';
  const tooltip = `${label} (⌘.)`;

  return (
    <Tooltip content={tooltip} side="bottom">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={() => dispatch(rightPanelToggled())}
        aria-label={label}
        aria-keyshortcuts="Meta+."
        aria-pressed={open}
      >
        <Icon icon={open ? Sidebar : SidebarSimple} size="md" mirrored />
      </Button>
    </Tooltip>
  );
}
