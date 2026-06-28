// Shared kernel public API. Other modules import from this barrel for types
// and pure helpers. Concrete-adapter wiring lives in @app/container/createContainer.ts.
export type { SharedContainer } from './container';
