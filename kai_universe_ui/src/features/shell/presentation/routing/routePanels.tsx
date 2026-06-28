import { ChatInferencePanel } from '@features/chat';
import { DocsSearchPanel } from '@features/developer-docs';
import { LocalServerRightRailSlot } from '@features/local-server';
import { MyModelsRightRailSlot } from '@features/my-models';
import { RemoteRightRail } from '@features/remote';

import type { ReactElement } from 'react';

// Single source of truth for the shell's top-level routes.
//
// Three concerns used to drift across three separate hardcoded lists:
//   - RightPanelPlaceholder's pathname switch (which panel to render)
//   - AppShellLayout.routeKeyFromPath (URL → route key)
//   - AppShellLayout.routeHasNoRightPanel + RightPanelToggle's hidden-list
//     (which routes have no contextual panel at all)
// They are now derived from this one table. Adding a route or moving a panel
// is a single-line change here.
export interface ShellRoute {
  // Stable key used by rightPanelOpenByRoute / RIGHT_PANEL_DEFAULTS.
  readonly key: string;
  // URL prefix matched with String.prototype.startsWith.
  readonly pathPrefix: string;
  // Contextual right-panel content for this route, or null when the route
  // has no panel (Settings / Discover / Onboarding).
  readonly renderRightPanel: (() => ReactElement) | null;
}

export const SHELL_ROUTES: readonly ShellRoute[] = [
  { key: 'chat', pathPrefix: '/chat', renderRightPanel: () => <ChatInferencePanel /> },
  { key: 'discover', pathPrefix: '/discover', renderRightPanel: null },
  {
    key: 'my-models',
    pathPrefix: '/my-models',
    renderRightPanel: () => <MyModelsRightRailSlot />,
  },
  {
    key: 'local-server',
    pathPrefix: '/local-server',
    renderRightPanel: () => <LocalServerRightRailSlot />,
  },
  {
    key: 'developer-docs',
    pathPrefix: '/developer-docs',
    renderRightPanel: () => <DocsSearchPanel />,
  },
  { key: 'remote', pathPrefix: '/remote', renderRightPanel: () => <RemoteRightRail /> },
  { key: 'settings', pathPrefix: '/settings', renderRightPanel: null },
  { key: 'onboarding', pathPrefix: '/onboarding', renderRightPanel: null },
];

// Resolve the active route record from a URL pathname. Returns the matching
// ShellRoute or undefined when the path is outside the known surfaces.
export function routeForPath(pathname: string): ShellRoute | undefined {
  return SHELL_ROUTES.find((r) => pathname.startsWith(r.pathPrefix));
}

// URL → route key. Falls back to 'chat' (the default landing surface) so
// callers that key per-route preferences always get a usable value.
export function routeKeyFromPath(pathname: string): string {
  return routeForPath(pathname)?.key ?? 'chat';
}

// True when the route renders no contextual right-panel content — used to
// suppress the 320px column and hide the toggle on those routes.
export function routeHasNoRightPanel(pathname: string): boolean {
  const route = routeForPath(pathname);
  // Unknown routes have no panel either.
  return route ? route.renderRightPanel === null : true;
}
