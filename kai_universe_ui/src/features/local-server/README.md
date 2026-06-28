# Developer feature

Owns the Developer L1 surface.

## Public API (barrel exports)

- `developerReducer`, `developerSlice` — wired into the root store
- `developerRoutes` — composed into the app router
- `wireDeveloperContainer(shared)` — contributes this feature's services to the DI container
- selectors prefixed `selectDeveloper*` — typed Redux selectors
- public hooks (added as the feature is built)

## Internal layers (NEVER import these from another feature)

- `domain/` — entities, value objects, port interfaces
- `application/` — use cases (orchestration, no I/O)
- `infrastructure/` — fixture repositories, simulators, persistence adapters
- `presentation/` — React components, hooks, Redux slice + RTK Query API
