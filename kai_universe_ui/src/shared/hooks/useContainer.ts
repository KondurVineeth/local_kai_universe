// Re-export from the app's container context. Lives here so feature presentation
// layers can do `import { useContainer } from '@shared/hooks/useContainer'` without
// importing @app/* (presentation can import shared, not the other way around).
//
// However, useContainer's *implementation* lives in @app/container/ContainerContext —
// only the type lives here. Renaming the import is what gives the boundary a clean shape.
//
// In practice, presentation layers import the hook directly via @app:
//   import { useContainer } from '@app/container/ContainerContext';
//
// This file exists as a placeholder for cross-feature hook utilities; concrete
// hooks (useDebounce, useMediaQuery, etc.) are added as features demand them.

export {};
