# Remote feature

Owns the Remote L1 surface (formerly "LM Link"). Manages the user's paired-device network: local device identity, paired peers, the add-device wizard (GUI / headless paths), the This Device settings dialog, the "Models on Remote Device" right rail.

## Public API

- `remoteReducer`, `remoteSlice` — wired into the root store
- `remoteRoutes` — composed into the app router (mounted at `/remote`)
- `wireRemoteContainer(shared)` — contributes `remoteModelsRepository` to the DI container
- `RemoteRightRail` — re-exported for `RightPanelPlaceholder` (shell-owned right column)
- `RemoteState` type

## Mock realism

Per project policy ("full simulation"):

- Clicking **Add a Device** opens a 3-step wizard, picks GUI or headless, walks the user through download/install/enable.
- On **Close**, schedules a 3-5s timer (`pendingPeerSpawnAt` is persisted so a reload mid-wait still resolves).
- When the timer expires, invents a peer device with a random name from `PEER_NAMES` and a 32-hex identifier. Status flips `connecting → online` after a 1s handshake.
- Each peer's model list is deterministically seeded from its identifier — same peer renders the same 3-5 models across reloads; different peers render different lists.
