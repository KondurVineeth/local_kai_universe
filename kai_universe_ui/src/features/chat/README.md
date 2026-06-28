# Chat feature

Owns the Chat L1 surface.

## Public API (barrel exports)

- `chatReducer`, `chatSlice` — wired into the root store
- `chatRoutes` — composed into the app router
- `wireChatContainer(shared)` — contributes this feature's services to the DI container
- selectors prefixed `selectChat*` — typed Redux selectors
- public hooks (added as the feature is built)

## Internal layers (NEVER import these from another feature)

- `domain/` — entities, value objects, port interfaces
- `application/` — use cases (orchestration, no I/O)
- `infrastructure/` — fixture repositories, simulators, persistence adapters
- `presentation/` — React components, hooks, Redux slice + RTK Query API
