// The Shell feature has no page routes of its own — it provides AppShellLayout
// (the global geometry) which wraps every other feature's route subtree.
// Exposed as an empty array for symmetry with sibling features so the app
// router composer can iterate uniformly.
import type { RouteObject } from 'react-router-dom';

export const shellRoutes: RouteObject[] = [];
