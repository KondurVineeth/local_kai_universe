import { useLocation } from 'react-router-dom';

import { routeForPath } from '../../routing/routePanels';

// The shell owns the right-panel column. Each feature can supply its own
// contextual right-panel content; the shell switches on the active URL.
//
// Reads `useLocation()` directly instead of the shell slice's
// `activeRouteKey` field, and resolves the panel via the single SHELL_ROUTES
// registry (see routing/routePanels) — previously three separate hardcoded
// route lists had to be kept in sync by hand.
export function RightPanelPlaceholder() {
  const { pathname } = useLocation();
  const route = routeForPath(pathname);
  if (!route?.renderRightPanel) return null;
  return route.renderRightPanel();
}
