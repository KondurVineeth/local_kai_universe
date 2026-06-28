// Lifecycle states for the simulated local HTTP server. Mirrors what a real
// ZL Universe server walks through — owned by the local-server slice so the
// top action bar, endpoint rows, log panel, and right rail can all derive
// from one source of truth.
export type ServerStatus =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';
