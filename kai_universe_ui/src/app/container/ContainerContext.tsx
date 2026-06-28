// The container context lives in @shared/container-context (so feature UI
// layers can access it without importing @app/*). This file re-exports it
// from @app for symmetry with the rest of the app composition root.
export {
  ContainerProvider,
  useContainer,
  type ContainerProviderProps,
} from '@shared/container-context';
