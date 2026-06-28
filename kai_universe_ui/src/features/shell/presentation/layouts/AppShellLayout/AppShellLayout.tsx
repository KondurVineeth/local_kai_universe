import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { selectSelectedModelId } from '@features/local-server';
import { selectOnboardingMode } from '@features/onboarding';
import { selectNavBarPosition } from '@features/settings';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { ModelReadyBanner } from '../../components/ModelReadyBanner';
import { PrimaryNavRail } from '../../components/PrimaryNavRail';
import { RightPanelPlaceholder } from '../../components/RightPanelPlaceholder';
import { TopHeaderBar } from '../../components/TopHeaderBar';
import { useAutoRestoreLastModel } from '../../hooks/useAutoRestoreLastModel';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';
import { routeHasNoRightPanel, routeKeyFromPath } from '../../routing/routePanels';
import { selectRightPanelOpen } from '../../store/selectors';
import { activeRouteSet } from '../../store/slice';

// LMS-SHELL-001 — AppShellLayout.
//
//   ┌─ TopHeaderBar (40px) ─────────────────────────────┐
//   ├─ rail ┬─ feature outlet ────────────────────┬─ rp ┤
//   │ 40px  │ (per-feature layout fills this slot │ 320 │
//   │       │  with its SecondarySidebar + main)  │     │
//   └───────┴─────────────────────────────────────┴─────┘
//
// User mode: the right panel is hidden entirely. In User mode there are no
// inference knobs to surface, so the column is dead weight; the mode chip in
// the top header gives the user a clear path to switch to Developer mode (or
// to open Settings) when they want the panel back.
export function AppShellLayout() {
  const dispatch = useAppDispatch();
  const rightPanelOpen = useAppSelector(selectRightPanelOpen);
  const mode = useAppSelector(selectOnboardingMode);
  const localServerSelectedModelId = useAppSelector(selectSelectedModelId);
  const navBarPosition = useAppSelector(selectNavBarPosition);
  const { pathname } = useLocation();

  // Keep `shell.activeRouteKey` in sync with the URL so the right-panel
  // toggle + keyboard shortcut mutate the CURRENT route's preference, not a
  // stale one. Previously this field was never written and every route's
  // toggle silently mutated `rightPanelOpenByRoute.chat`.
  useEffect(() => {
    dispatch(activeRouteSet(routeKeyFromPath(pathname)));
  }, [dispatch, pathname]);

  // Remote and Developer Docs bypass the developer-mode gate: Remote's
  // models-on-peer rail and the docs search panel are both first-class
  // surfaces for their pages, not power-user settings. Hiding them in
  // user mode would leave Remote with no peer-model list and the docs
  // page with no way to search.
  const isRemoteRoute = pathname.startsWith('/remote');
  const isDocsRoute = pathname.startsWith('/developer-docs');
  const isLocalServerRoute = pathname.startsWith('/local-server');
  // Routes that have no contextual right-panel content. Allocating the
  // 320px column on these reads as broken — resolved from the SHELL_ROUTES
  // registry so the panel + toggle + layout all agree.
  const hasNoRightPanel = routeHasNoRightPanel(pathname);
  const showRightPanel =
    !hasNoRightPanel &&
    ((isLocalServerRoute && localServerSelectedModelId !== null) ||
      (rightPanelOpen && (mode === 'developer' || isRemoteRoute || isDocsRoute)));
  // UX-SHELL-003: silently re-load the user's last-good model on app boot.
  useAutoRestoreLastModel();
  // UX-SHELL-008: ⌘L / ⌘\ / ⌘. global shortcuts.
  useGlobalShortcuts();

  // navBarPosition (Settings → Appearance) places the primary icon rail on
  // the left (default) or the right edge. The rail is reordered within the
  // grid and given the matching border side via the `position` prop.
  const navOnRight = navBarPosition === 'right';
  return (
    <div className="grid h-full w-full grid-rows-[40px_1fr] bg-bg-base text-fg-default">
      <TopHeaderBar />
      <div
        className={cn(
          // grid-rows track caps the single row at the container height so
          // every feature layout below gets a bounded height even if its
          // own grid omits an explicit row track.
          'grid min-h-0 grid-rows-[minmax(0,1fr)]',
          navOnRight ? 'grid-cols-[1fr_auto_48px]' : 'grid-cols-[48px_1fr_auto]',
        )}
      >
        {!navOnRight && <PrimaryNavRail position="left" />}
        <main className="min-w-0 overflow-hidden">
          <Outlet />
        </main>
        <div
          className="overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: showRightPanel ? 320 : 0 }}
          aria-hidden={!showRightPanel}
        >
          <RightPanelPlaceholder />
        </div>
        {navOnRight && <PrimaryNavRail position="right" />}
      </div>
      <ModelReadyBanner />
    </div>
  );
}
