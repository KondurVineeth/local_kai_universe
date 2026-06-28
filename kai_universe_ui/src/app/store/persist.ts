// redux-persist storage adapter backed by our typed KvStore. Slices opt into
// persistence by joining the whitelist below; the default is non-persistent so
// new features don't accidentally serialize huge blobs.
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  createMigrate,
  createTransform,
  persistReducer,
  type PersistConfig,
  type Storage,
} from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { createKvStore } from '@shared/persistence/KvStore';

import { rootReducer } from './rootReducer';
import { reportStorageQuotaExceeded } from './storageEvents';

const kv = createKvStore();

// redux-persist expects a Web Storage-shaped adapter (string get/set/remove).
// KvStore stores JSON-encoded values, but redux-persist already serializes the
// state — so we bypass KvStore's JSON wrapper here and read/write raw strings.
//
// setItem wraps the localStorage write in try/catch. On QuotaExceededError (or
// any other write failure) we route the failure through `storageEvents` so a
// shell-level toast can react. The promise still resolves so redux-persist's
// internal queue doesn't crash and freeze further writes.
const storage: Storage = {
  getItem(key) {
    const raw = (typeof window !== 'undefined' && window.localStorage)
      ? window.localStorage.getItem(`zl-universe-fe::${key}`)
      : null;
    return Promise.resolve(raw);
  },
  setItem(key, value) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`zl-universe-fe::${key}`, value);
      } catch (err) {
        // QuotaExceededError (Chromium/Firefox/Safari name it differently) or
        // any other localStorage failure. Route through the storageEvents
        // indirection so the persist module doesn't import the store
        // directly (avoids a persist.ts ↔ store/index.ts cycle).
        reportStorageQuotaExceeded({
          key,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return Promise.resolve(value);
  },
  removeItem(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(`zl-universe-fe::${key}`);
      } catch {
        // remove failures are not actionable for the user; ignore.
      }
    }
    return Promise.resolve();
  },
};

// Reference the unused kv to avoid unused-import lint errors. KvStore is the
// canonical store for non-Redux persistence (per-feature ad-hoc reads/writes).
void kv;

// Migration policy — additive merges only.
//
// `redux-persist` runs each migration whose key is greater than the persisted
// version, IN NUMERIC ORDER. The previous version of this map was authored
// with v2/v4/v3 declared out of order AND v3 destructively rebuilt
// `chatConfig.config` from `old`, which made any field NOT explicitly carried
// over come back as `undefined` (e.g. user-saved fields from a custom build).
//
// Rules going forward:
//   - Key the object in monotonic numeric order so the file matches run order.
//   - Each migration starts from the previous-version state and ONLY adds new
//     keys with sane defaults (spread the new defaults FIRST, then spread the
//     existing state so user data wins over defaults).
//   - Never destructively rewrite a sub-tree; if a new shape is needed, layer
//     defaults underneath the old values.
const migrations = {
  // v1 → v2: chat slice gained folders, notesByThread, attachmentsByThread,
  // splitThreadId. Additive merge — defaults sit underneath the existing chat.
  2: (state: { chat?: Record<string, unknown> } | undefined) => {
    if (!state?.chat) return state;
    return {
      ...state,
      chat: {
        folders: [],
        notesByThread: {},
        attachmentsByThread: {},
        splitThreadId: null,
        ...state.chat,
      },
    };
  },
  // v2 → v3: chatConfig.config gained limit/overflow/stop-strings/per-knob
  // enable flags. Backfill ONLY the new keys; do not rewrite the existing
  // config object (the previous incarnation of this migration was
  // destructive, which dropped any custom fields users had saved and made
  // `selectInferenceConfig` indexes return undefined).
  3: (state: { chatConfig?: { config?: Record<string, unknown> } } | undefined) => {
    if (!state?.chatConfig?.config) return state;
    const old = state.chatConfig.config;
    return {
      ...state,
      chatConfig: {
        ...state.chatConfig,
        config: {
          // New v3 defaults — old values override these via the spread below.
          systemPrompt: '',
          temperature: 0.6,
          limitResponseLength: false,
          responseLengthLimit: 1024,
          contextOverflow: 'truncate-middle',
          stopStrings: [],
          topK: 20,
          repeatPenaltyEnabled: false,
          repeatPenalty: 1.1,
          topPEnabled: true,
          topP: 0.95,
          minPEnabled: true,
          minP: 0,
          structuredOutputEnabled: false,
          structuredOutputSchema: '',
          speculativeDecodingEnabled: false,
          draftModelId: null,
          draftTokens: 2,
          visualizeDraftTokens: false,
          ...old,
        },
      },
    };
  },
  // v3 → v4: chatConfig gained `availableIntegrations` (the install-plugin
  // dialog needs to add to a slice-owned list). Backfill ONLY when missing —
  // preserves any list customised by a future devtools-side write.
  4: (state: { chatConfig?: Record<string, unknown> } | undefined) => {
    if (!state?.chatConfig) return state;
    if ((state.chatConfig as { availableIntegrations?: unknown }).availableIntegrations) return state;
    return {
      ...state,
      chatConfig: {
        ...state.chatConfig,
        availableIntegrations: [
          { id: 'js-sandbox', name: 'JS Code Sandbox', description: 'Run JavaScript snippets in a sandbox' },
          { id: 'web-search', name: 'Web Search', description: 'Augment answers with web results' },
          { id: 'rag-v1', name: 'Document RAG', description: 'Retrieve from indexed documents' },
          { id: 'image-gen', name: 'Image Generation', description: 'Generate images via local diffuser' },
        ],
      },
    };
  },
  // v4 → v5: chat slice gained `draftsByThread` (per-thread compose drafts —
  // BUG-CHAT-COMPOSE-006). Backfill an empty record so reducers that index
  // into it never operate on `undefined` after rehydrate.
  5: (state: { chat?: Record<string, unknown> } | undefined) => {
    if (!state?.chat) return state;
    if ((state.chat as { draftsByThread?: unknown }).draftsByThread) return state;
    return {
      ...state,
      chat: {
        ...state.chat,
        draftsByThread: {},
      },
    };
  },
  // v5 → v6: shell slice gained `lastLoadedModelId` (UX-SHELL-003 — restore
  // user's last choice on next launch). Backfill null. Also: any persisted
  // `loadedModelId` / `modelLoadStatus` / `modelLoadError` values from v5 are
  // now stripped on outbound by `shellOnlyUserPrefsTransform`, but the
  // already-on-disk v5 blob may still carry them. Strip them here so the
  // first rehydrate after upgrade lands the slice in a clean transient state.
  6: (state: { shell?: Record<string, unknown> } | undefined) => {
    if (!state?.shell) return state;
    const {
      loadedModelId: _loadedModelId,
      modelLoadStatus: _modelLoadStatus,
      modelLoadError: _modelLoadError,
      ...rest
    } = state.shell as Record<string, unknown>;
    void _loadedModelId; void _modelLoadStatus; void _modelLoadError;
    return {
      ...state,
      shell: {
        lastLoadedModelId: null,
        ...rest,
      },
    };
  },
  // v6 → v7: scrub stale onboarding work-state. Earlier builds persisted
  // the fixture HardwareSpec / recommendations directly into the
  // onboarding slice. The new ElectronSystemRepository returns REAL
  // hardware, but if the user already ran the wizard against the fixture,
  // their localStorage still has those numbers and the HardwareScreen's
  // mount effect would otherwise short-circuit re-detection. Wipe the
  // transient fields; `completed` / `lastStep` / `mode` / `selectedModelId`
  // (the committed bits) survive.
  7: (state: { onboarding?: Record<string, unknown> } | undefined) => {
    if (!state?.onboarding) return state;
    const o = state.onboarding as Record<string, unknown>;
    return {
      ...state,
      onboarding: {
        completed: o.completed ?? false,
        lastStep: o.lastStep ?? 'welcome',
        mode: o.mode ?? 'user',
        selectedModelId: o.selectedModelId ?? null,
        // The slice's initialState fills these in on first reducer pass,
        // but listing them here keeps the post-migration shape obvious.
        hardware: null,
        hardwareDetecting: false,
        recommendations: [],
        recommendationsLoaded: false,
        setupRunning: false,
        progressPct: 0,
      },
    };
  },
  // v7 → v8: settings slice gained Theme / Language / Server / Runtime /
  // LM Link fields (ZL Universe parity). Seed defaults — no prior persisted
  // settings shape to preserve, since v7's settings slice held only a single
  // transient `_initialized` boolean.
  8: (state: Record<string, unknown> | undefined) => {
    if (!state) return state;
    return {
      ...state,
      settings: {
        theme: 'dark',
        language: 'en',
        serverEnabled: false,
        serverPort: 1234,
        serveOnLocalNetwork: false,
        runtimeAutoUpdate: true,
        lmLinkEnabled: false,
      },
    };
  },
  // v8 → v9: shell now persists `loadedModelId` + `modelLoadStatus` so
  // refresh = same state (no fake re-load animation). Existing v8 blobs
  // had those fields stripped — backfill from `lastLoadedModelId` so
  // users who had a model loaded before the upgrade come back to the
  // same state they expected.
  9: (state: { shell?: Record<string, unknown> } | undefined) => {
    if (!state?.shell) return state;
    const s = state.shell as Record<string, unknown>;
    const lastId = s.lastLoadedModelId ?? null;
    return {
      ...state,
      shell: {
        ...s,
        loadedModelId: lastId,
        modelLoadStatus: lastId !== null ? 'loaded' : 'idle',
        modelLoadError: null,
      },
    };
  },
  // v9 → v10: chatConfig gained `sidebarSort` and chat slice gained
  // `reasoningOverridesByThread`. Backfill defaults so the slice is safe to
  // index after rehydrate.
  10: (state: Record<string, unknown> | undefined) => {
    if (!state) return state;
    const cfg = (state.chatConfig as Record<string, unknown> | undefined) ?? {};
    const chat = (state.chat as Record<string, unknown> | undefined) ?? {};
    return {
      ...state,
      chatConfig: { ...cfg, sidebarSort: cfg.sidebarSort ?? 'recent' },
      chat: {
        ...chat,
        reasoningOverridesByThread: chat.reasoningOverridesByThread ?? {},
      },
    };
  },
  // v10 → v11: chat slice gained `notesUpdatedByThread` (per-thread last-
  // edit ISO timestamps for the Notes panel "Saved · 2 min ago" line) and
  // `multiSelectedThreadIds` (the sidebar's bulk-select set). Both default
  // to empty objects on existing installs.
  11: (state: { chat?: Record<string, unknown> } | undefined) => {
    if (!state?.chat) return state;
    const chat = state.chat as Record<string, unknown>;
    return {
      ...state,
      chat: {
        ...chat,
        notesUpdatedByThread: chat.notesUpdatedByThread ?? {},
        multiSelectedThreadIds: chat.multiSelectedThreadIds ?? {},
      },
    };
  },
  // v11 → v12: shell `rightPanelOpen: boolean` → `rightPanelOpenByRoute:
  // Record<string, boolean>` so each top-level route remembers its own
  // collapse preference. Existing installs: carry the old single boolean
  // forward as Chat's value (where the panel actually lived) and apply
  // route defaults for the rest.
  12: (state: { shell?: Record<string, unknown> } | undefined) => {
    if (!state?.shell) return state;
    const shell = state.shell as Record<string, unknown>;
    const old = shell.rightPanelOpen;
    const carriedChat = typeof old === 'boolean' ? old : true;
    const { rightPanelOpen: _drop, ...rest } = shell;
    void _drop;
    return {
      ...state,
      shell: {
        ...rest,
        rightPanelOpenByRoute: {
          chat: carriedChat,
          discover: false,
          'my-models': false,
          developer: false,
          'lm-link': false,
          settings: false,
          onboarding: false,
        },
      },
    };
  },
  // chatConfig gained `chatListCompact` (compact-rows toggle in the View
  // menu) — backfill false on existing installs.
  13: (state: Record<string, unknown> | undefined) => {
    if (!state) return state;
    const cfg = (state.chatConfig as Record<string, unknown> | undefined) ?? {};
    return {
      ...state,
      chatConfig: { ...cfg, chatListCompact: cfg.chatListCompact ?? false },
    };
  },
  // v13 → v14: myModels gained the installed-model ledger
  // (`installedModelIds`, `installedAtByModel`, `installedQuantByModel`)
  // when Model entity stopped carrying user state. Pre-v14 installs had no
  // myModels slice persisted at all (it was added to the whitelist in this
  // same bump), so the migration just ensures the keys exist with empty
  // defaults.
  14: (state: Record<string, unknown> | undefined) => {
    if (!state) return state;
    const my = (state.myModels as Record<string, unknown> | undefined) ?? {};
    return {
      ...state,
      myModels: {
        ...my,
        installedModelIds: my.installedModelIds ?? [],
        installedAtByModel: my.installedAtByModel ?? {},
        installedQuantByModel: my.installedQuantByModel ?? {},
      },
    };
  },
  // v14 → v15: backfill the install-ledger from the shell's loaded-model
  // state. Pre-v14 the only signal a model had been "installed" was that
  // the shell loaded it (onboarding completion → loadModelThunk). Without
  // this backfill, anyone who finished onboarding before the My Models
  // ledger existed wakes up with a loaded model that My Models doesn't
  // know about and the global picker's "Your Models" list refuses to
  // include.
  //
  // The earlier attempt to do this inside the v14 migration didn't help
  // users whose store had already migrated to v14 with empty defaults —
  // redux-persist only runs each migration once per version transition.
  // Bumping forces it to run again on those installs.
  //
  // Quantization is left as-is (no synthetic value injected) — the UI
  // falls back to the first variant via `m.variants[0]` when no per-model
  // quant is recorded, which is good enough for legacy entries. The real
  // value gets written the next time the model is downloaded fresh.
  15: (state: Record<string, unknown> | undefined) => {
    if (!state) return state;
    const my = (state.myModels as Record<string, unknown> | undefined) ?? {};
    const shell = (state.shell as Record<string, unknown> | undefined) ?? {};

    const existingIds = Array.isArray(my.installedModelIds)
      ? (my.installedModelIds as string[])
      : [];
    const existingAt = (my.installedAtByModel as Record<string, string> | undefined) ?? {};
    const existingQuant =
      (my.installedQuantByModel as Record<string, string> | undefined) ?? {};

    const carryIds = new Set<string>(existingIds);
    const seedAt: Record<string, string> = { ...existingAt };
    const now = new Date().toISOString();
    const loadedId = typeof shell.loadedModelId === 'string' ? shell.loadedModelId : null;
    const lastLoadedId =
      typeof shell.lastLoadedModelId === 'string' ? shell.lastLoadedModelId : null;
    for (const id of [loadedId, lastLoadedId]) {
      if (id && !carryIds.has(id)) {
        carryIds.add(id);
        seedAt[id] = seedAt[id] ?? now;
      }
    }

    return {
      ...state,
      myModels: {
        ...my,
        installedModelIds: [...carryIds],
        installedAtByModel: seedAt,
        installedQuantByModel: existingQuant,
      },
    };
  },
  // v15 → v16: LM Link rebrand → Remote.
  //   - `settings.lmLinkEnabled` becomes `settings.remoteEnabled` (carry the
  //     existing boolean over so users who flipped it on don't lose the
  //     state, and drop the old key so the slice's type-guard doesn't
  //     warn).
  //   - `shell.rightPanelOpenByRoute['lm-link']` becomes the same key
  //     under `'remote'`. The Remote rail defaults open; if the user had
  //     explicitly collapsed it pre-rename we honour that.
  //   - `remote` slice itself is fresh — no prior shape to preserve. The
  //     reducer's `initialState` handles seeding (localDevice with a
  //     random identifier on first hydrate).
  16: (state: Record<string, unknown> | undefined) => {
    if (!state) return state;
    const settings = (state.settings as Record<string, unknown> | undefined) ?? {};
    const shell = (state.shell as Record<string, unknown> | undefined) ?? {};
    const rpob = (shell.rightPanelOpenByRoute as Record<string, boolean> | undefined) ?? {};
    const { lmLinkEnabled, ...settingsRest } = settings as { lmLinkEnabled?: boolean } & Record<string, unknown>;
    const remoteEnabled = settingsRest.remoteEnabled ?? lmLinkEnabled ?? false;
    const { 'lm-link': lmLinkRpob, ...rpobRest } = rpob;
    return {
      ...state,
      settings: { ...settingsRest, remoteEnabled },
      shell: {
        ...shell,
        rightPanelOpenByRoute: {
          ...rpobRest,
          remote: rpobRest.remote ?? lmLinkRpob ?? true,
        },
      },
    };
  },
  // v17 → v18: remote slice gained `authStatus` (landing-screen auth state
  // machine). Pre-v18 persisted blobs have no `authStatus` key; backfill
  // 'unauthenticated' so the landing screen renders correctly on first boot
  // after upgrade.
  18: (state: Record<string, unknown> | undefined) => {
    if (!state?.remote) return state;
    const r = state.remote as Record<string, unknown>;
    return {
      ...state,
      remote: {
        ...r,
        authStatus: r.authStatus ?? 'unauthenticated',
      },
    };
  },
  // v16 → v17: split the old `Developer` tab into two L1 surfaces — Local
  // Server (kept in place of the original Developer icon) and the new
  // Developer Docs entry. The `developer` key in
  // `shell.rightPanelOpenByRoute` is now stale; carry its boolean forward
  // to `local-server` and seed `developer-docs` to open by default (it
  // shows the docs search panel and demands the rail to be useful).
  17: (state: Record<string, unknown> | undefined) => {
    if (!state) return state;
    const shell = (state.shell as Record<string, unknown> | undefined) ?? {};
    const rpob = (shell.rightPanelOpenByRoute as Record<string, boolean> | undefined) ?? {};
    const { developer: devRpob, ...rpobRest } = rpob;
    return {
      ...state,
      shell: {
        ...shell,
        rightPanelOpenByRoute: {
          ...rpobRest,
          'local-server': rpobRest['local-server'] ?? devRpob ?? false,
          'developer-docs': rpobRest['developer-docs'] ?? true,
        },
      },
    };
  },
};

// Outbound shell transform — what gets written to disk on every save.
//
// Earlier policy (UX-SHELL-003) stripped `loadedModelId` / `modelLoadStatus`
// entirely and re-ran a fake load thunk on boot to "restore" the user's
// last-good model. That gave refresh a 3-5s loading animation for nothing
// — the mock has no actual GPU memory to populate, so the only thing being
// faked was the wait. Reverted: we now persist the load state directly,
// so a refresh lands the user back at exactly the state they left.
//
// Transient sub-states (`loading`, `unloading`, `error`) ARE normalized on
// save — those represent in-flight thunks that won't resume across a
// restart, so persisting them would leave the app stuck on a phantom
// loading screen. Anything not 'loaded' becomes 'idle' with no model.
const shellOnlyUserPrefsTransform = createTransform(
  (inboundState: unknown) => {
    if (inboundState === null || typeof inboundState !== 'object') return inboundState;
    const s = inboundState as Record<string, unknown>;
    const status = s.modelLoadStatus === 'loaded' ? 'loaded' : 'idle';
    const loadedId = status === 'loaded' ? s.loadedModelId : null;
    return {
      secondarySidebarHidden: s.secondarySidebarHidden,
      rightPanelOpenByRoute: s.rightPanelOpenByRoute,
      activeRouteKey: s.activeRouteKey,
      downloadsPanelOpen: s.downloadsPanelOpen,
      modelPickerFilter: s.modelPickerFilter,
      lastLoadedModelId: s.lastLoadedModelId,
      loadedModelId: loadedId,
      modelLoadStatus: status,
      modelLoadError: null,
    };
  },
  (outboundState: unknown) => outboundState,
  { whitelist: ['shell'] },
);

// Remote slice transform — strip transient UI state on write.
//
// Persist: localDevice, devices, selectedDeviceId, pendingPeerSpawnAt.
// Discard: wizardStep, thisDeviceDialogOpen, modelsFilterQuery. Those
// are dialog/in-flight UI flags — restoring them on reload would, e.g.,
// pop the AddDevice wizard back open immediately on app launch.
const remoteCommittedOnlyTransform = createTransform(
  (inboundState: unknown) => {
    if (inboundState === null || typeof inboundState !== 'object') return inboundState;
    const s = inboundState as Record<string, unknown>;
    // Scrub `authenticating` on rehydrate. There's no resume thunk for the
    // mock OAuth timer, so restoring a mid-flight value would leave the UI
    // stuck on "Complete in the browser…" forever. Treat it as a transient
    // flag — completed sessions persist as `authenticated`; everything else
    // re-derives as `unauthenticated` and the user can re-click Login.
    const rawAuth = s.authStatus;
    const authStatus = rawAuth === 'authenticated' ? 'authenticated' : 'unauthenticated';
    return {
      localDevice: s.localDevice,
      devices: s.devices,
      selectedDeviceId: s.selectedDeviceId,
      pendingPeerSpawnAt: s.pendingPeerSpawnAt,
      // GUI/headless flavour of a peer-spawn scheduled before a reload, and
      // the user's per-device "in use" remote-model choice — both committed
      // state that should survive a restart.
      pendingPeerSpawnKind: s.pendingPeerSpawnKind,
      selectedRemoteModelByDevice: s.selectedRemoteModelByDevice,
      authStatus,
    };
  },
  (outboundState: unknown) => outboundState,
  { whitelist: ['remote'] },
);

// Local Server transform — persist only the user's committed configuration
// (load/inference settings, API tokens). Everything else (live server
// status, log buffer, request counter, dialog-open flags, synthetic-traffic
// toggle) is transient runtime state that must re-derive cleanly on reload.
const localServerCommittedTransform = createTransform(
  (inboundState: unknown) => {
    if (inboundState === null || typeof inboundState !== 'object') return inboundState;
    const s = inboundState as Record<string, unknown>;
    return {
      apiTokens: s.apiTokens,
      loadConfig: s.loadConfig,
      inferenceConfig: s.inferenceConfig,
    };
  },
  (outboundState: unknown) => outboundState,
  { whitelist: ['localServer'] },
);

// Discover transform — persist only completed downloads. In-flight entries
// (queued/downloading/paused) can't resume across a restart, and
// failed/cancelled entries are noise; dropping them lets a reloaded Discover
// re-derive a clean state. Search/category/sort intentionally reset per
// session rather than persisting a stale query.
const discoverCommittedTransform = createTransform(
  (inboundState: unknown) => {
    if (inboundState === null || typeof inboundState !== 'object') return inboundState;
    const s = inboundState as Record<string, unknown>;
    const downloads = (s.downloads as Record<string, { status?: string }> | undefined) ?? {};
    const terminal: Record<string, unknown> = {};
    for (const [modelId, entry] of Object.entries(downloads)) {
      if (entry && entry.status === 'completed') terminal[modelId] = entry;
    }
    return { downloads: terminal };
  },
  (outboundState: unknown) => outboundState,
  { whitelist: ['discover'] },
);

// Same pattern as shellOnlyUserPrefsTransform — only persist the bits the
// user has *committed* to (mode choice, completion flag, last step
// reached). Transient working state (hardware probe, recommendations,
// in-flight setup progress) re-derives on each session so a reload
// mid-onboarding restarts the active step cleanly instead of resuming
// against frozen state.
const onboardingOnlyCommittedTransform = createTransform(
  (inboundState: unknown) => {
    if (inboundState === null || typeof inboundState !== 'object') return inboundState;
    const s = inboundState as Record<string, unknown>;
    return {
      completed: s.completed,
      lastStep: s.lastStep,
      mode: s.mode,
      selectedModelId: s.selectedModelId,
    };
  },
  (outboundState: unknown) => outboundState,
  { whitelist: ['onboarding'] },
);

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  storage,
  // Whitelist:
  //   shell — sidebar/right-panel UI state + `lastLoadedModelId` (window
  //           remembers layout + the user's last-good model). Transient
  //           runtime fields (loadedModelId / modelLoadStatus /
  //           modelLoadError) are stripped on write by
  //           `shellOnlyUserPrefsTransform` — see UX-SHELL-003.
  //   chat  — threads + messages survive reload. The LocalStorageChatRepository
  //           ALSO writes to localStorage, but redux-persist is the source of
  //           truth on rehydrate so the slice and the repo can drift slightly
  //           if the user closes mid-stream; ChatActivePage hydrates the
  //           selected thread from the repo on mount to reconcile.
  //   chatConfig — inference settings + presets + section expanded state.
  // myModels — installed-model ledger: `installedModelIds`,
  // `installedAtByModel`, `installedQuantByModel`, plus pin/load/inference
  // overrides. Without persistence a downloaded model would vanish on
  // reload, defeating the whole point of pretending we keep weights on
  // disk.
  // remote — paired peers + the local device's identity (name + 32-hex
  // identifier) + selected-device pointer + pendingPeerSpawnAt (so a
  // reload mid-wait still spawns the device that was promised). Transient
  // UI flags (wizard step, dialog open, filter query) are stripped on
  // write by `remoteCommittedOnlyTransform`.
  whitelist: ['shell', 'chat', 'chatConfig', 'onboarding', 'settings', 'myModels', 'remote', 'developerDocs', 'localServer', 'discover'],
  transforms: [
    shellOnlyUserPrefsTransform,
    onboardingOnlyCommittedTransform,
    remoteCommittedOnlyTransform,
    localServerCommittedTransform,
    discoverCommittedTransform,
  ],
  version: 18,
  migrate: createMigrate(migrations as Parameters<typeof createMigrate>[0], { debug: false }),
  // autoMergeLevel2 merges the persisted slice INTO each slice's
  // initialState at level 2 (i.e., per slice key), so a slice that
  // joined the whitelist mid-life (myModels in v14, remote in v16) or
  // has fields stripped on write by a transform (shell/onboarding/remote)
  // doesn't end up with `undefined` where the slice's initialState has
  // a real default. Default `autoMergeLevel1` replaces the slice
  // wholesale and was the root cause of the
  // "Cannot read properties of undefined (reading 'trim')" crashes seen
  // in Remote/RightRail and MyModels selectors. Choosing level2 over
  // level3 because no slice has deep nested defaults that need
  // recursive merging — level2 is just enough.
  stateReconciler: autoMergeLevel2,
};

export const persistedRootReducer = persistReducer(persistConfig, rootReducer);

// Redux-persist dispatches non-serializable lifecycle actions; these need to
// be allowlisted in `serializableCheck.ignoredActions` when configuring store.
export const PERSIST_LIFECYCLE_ACTIONS = [
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
] as const;
