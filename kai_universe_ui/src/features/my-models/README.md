# MyModels feature

Owns the MyModels L1 surface.

## Public API (barrel exports)

- `myModelsReducer`, `myModelsSlice` — wired into the root store
- `myModelsRoutes` — composed into the app router
- `wireMyModelsContainer(shared)` — contributes this feature's services to the DI container
- selectors prefixed `selectMyModels*` — typed Redux selectors
- public hooks (added as the feature is built)

## Internal layers (NEVER import these from another feature)

- `domain/` — entities, value objects, port interfaces
- `application/` — use cases (orchestration, no I/O)
- `infrastructure/` — fixture repositories, simulators, persistence adapters
- `presentation/` — React components, hooks, Redux slice + RTK Query API
