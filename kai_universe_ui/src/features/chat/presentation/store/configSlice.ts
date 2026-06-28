import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  DEFAULT_INFERENCE_CONFIG,
  type InferenceConfig,
} from '../../domain/entities/InferenceConfig';

import type { Preset } from '../../domain/entities/Preset';

// Built-in presets are tiny seed data — colocated here so presentation never
// has to reach into infrastructure. If they grow into a real fixture, promote
// them to a per-feature application-layer registry.
const BUILT_IN_PRESETS: readonly Preset[] = [
  { id: 'preset_default', name: 'Default', builtIn: true, config: DEFAULT_INFERENCE_CONFIG },
  {
    id: 'preset_creative',
    name: 'Creative',
    builtIn: true,
    config: {
      ...DEFAULT_INFERENCE_CONFIG,
      temperature: 1.2,
      topP: 0.99,
      repeatPenaltyEnabled: true,
      repeatPenalty: 1.05,
    },
  },
  {
    id: 'preset_precise',
    name: 'Precise',
    builtIn: true,
    config: {
      ...DEFAULT_INFERENCE_CONFIG,
      temperature: 0.2,
      topP: 0.5,
      repeatPenaltyEnabled: true,
      repeatPenalty: 1.15,
    },
  },
];

// CONFIG-026: known config keys, computed once. `applyPreset` and
// `saveAsPreset` strip unknown keys against this set so obsolete fields
// (removed by past migrations) can't resurrect on a round-trip.
const KNOWN_CONFIG_KEYS = Object.keys(DEFAULT_INFERENCE_CONFIG) as (keyof InferenceConfig)[];

function pickKnownConfigFields(input: Partial<InferenceConfig>): Partial<InferenceConfig> {
  const out: Partial<InferenceConfig> = {};
  for (const key of KNOWN_CONFIG_KEYS) {
    if (key in input) {
      // Type-safe at runtime: we only copy keys we declared as the canonical set.
      (out as Record<string, unknown>)[key] = (input as Record<string, unknown>)[key];
    }
  }
  return out;
}

// Default-preset id (used as the fallback target when the active preset is
// deleted, see CONFIG-011).
const DEFAULT_PRESET_ID = BUILT_IN_PRESETS[0]!.id;

export type PanelKey =
  | 'systemPrompt'
  | 'modelSettings'
  | 'sampling'
  | 'structuredOutput'
  | 'speculativeDecoding'
  | 'notes';

export type InferenceTab = 'integrations' | 'settings';

export interface AvailableIntegration {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly userInstalled?: boolean;
}

const DEFAULT_INTEGRATIONS: AvailableIntegration[] = [
  { id: 'js-sandbox', name: 'JS Code Sandbox', description: 'Run JavaScript snippets in a sandbox' },
  { id: 'web-search', name: 'Web Search', description: 'Augment answers with web results' },
  { id: 'rag-v1', name: 'Document RAG', description: 'Retrieve from indexed documents' },
  { id: 'image-gen', name: 'Image Generation', description: 'Generate images via local diffuser' },
];

export interface ChatConfigState {
  readonly config: InferenceConfig;
  readonly currentPresetId: string;
  // Immer's WritableDraft can't wrap `readonly Array`; using mutable arrays
  // here matches what the slice writes back. Selectors expose readonly views.
  readonly presets: Preset[];
  readonly expanded: Readonly<Record<PanelKey, boolean>>;
  readonly availableIntegrations: AvailableIntegration[];
  readonly enabledIntegrationIds: string[];
  // Reasoning trace toggle in the input dock — global, persists across
  // sessions. Off by default for non-thinking models; users flip it on
  // when they want to see the model's intermediate trace.
  readonly reasoningEnabled: boolean;
  // CONFIG-022: which inference-panel tab is active (settings vs.
  // integrations). Lifted out of `ChatInferencePanel`'s local useState so
  // the choice survives navigation between chats AND a reload (chatConfig
  // is in the redux-persist whitelist).
  readonly inferenceTab: InferenceTab;
  // Denser sidebar rows for power users. Trims vertical padding so more
  // threads fit per viewport. Persisted via the chatConfig whitelist.
  // NOTE: sidebar SORT now lives in `@features/settings` (single source of
  // truth) — the chat duplicate was removed.
  readonly chatListCompact: boolean;
  // Monotonic per-panel "scroll me into view" request counter. The `/system`
  // slash command bumps `systemPrompt`; SystemPromptPanel watches the value
  // and calls scrollIntoView when it changes. Not persisted-meaningful but
  // harmless if it rides along.
  readonly panelScrollRequest: Readonly<Record<PanelKey, number>>;
}

const initialState: ChatConfigState = {
  config: DEFAULT_INFERENCE_CONFIG,
  currentPresetId: DEFAULT_PRESET_ID,
  presets: [...BUILT_IN_PRESETS],
  availableIntegrations: [...DEFAULT_INTEGRATIONS],
  reasoningEnabled: true,
  expanded: {
    systemPrompt: true,
    modelSettings: false,
    sampling: false,
    structuredOutput: false,
    speculativeDecoding: false,
    notes: false,
  },
  enabledIntegrationIds: [],
  inferenceTab: 'settings',
  chatListCompact: false,
  panelScrollRequest: {
    systemPrompt: 0,
    modelSettings: 0,
    sampling: 0,
    structuredOutput: 0,
    speculativeDecoding: 0,
    notes: 0,
  },
};

function newPresetId(): string {
  return `preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// CONFIG-009: produce a non-colliding preset name. Built-in names (Default,
// Creative, Precise) are reserved — if the user types one, we suffix " (1)"
// (and " (2)", etc. on further collisions) so we never silently overwrite.
function uniquePresetName(raw: string, existing: readonly Preset[]): string {
  const base = raw.trim() || 'Untitled';
  const taken = new Set(existing.map((p) => p.name));
  if (!taken.has(base)) return base;
  let n = 1;
  // Cap at a reasonable number of attempts; in practice users will never hit
  // this. Bound prevents infinite loops if someone mass-creates presets.
  while (n < 1000) {
    const candidate = `${base} (${n})`;
    if (!taken.has(candidate)) return candidate;
    n += 1;
  }
  return `${base} (${Date.now().toString(36)})`;
}

export const chatConfigSlice = createSlice({
  name: 'chatConfig',
  initialState,
  reducers: {
    setConfigField(
      state,
      action: PayloadAction<{ key: keyof InferenceConfig; value: unknown }>,
    ) {
      const next = { ...state.config, [action.payload.key]: action.payload.value };
      // Cast: Immer's draft type is mutable, our InferenceConfig is readonly.
      // The runtime shape matches; the slice always replaces config wholesale.
      state.config = next as unknown as ChatConfigState['config'];
      // CONFIG-023: only blank `currentPresetId` when the new value actually
      // diverges from the active preset's stored value. A round-trip back to
      // the preset value (or a no-op write) shouldn't drop the user out to
      // "Custom" — it's confusing and resets the dropdown selection mid-edit.
      const active = state.presets.find((p) => p.id === state.currentPresetId);
      if (active) {
        const presetValue = (active.config as Record<string, unknown>)[action.payload.key];
        if (!Object.is(presetValue, action.payload.value)) {
          // Real drift — fall back to "Custom".
          state.currentPresetId = '';
        }
      }
    },
    togglePanel(state, action: PayloadAction<PanelKey>) {
      state.expanded = { ...state.expanded, [action.payload]: !state.expanded[action.payload] };
    },
    setPanelExpanded(
      state,
      action: PayloadAction<{ panel: PanelKey; expanded: boolean }>,
    ) {
      state.expanded = { ...state.expanded, [action.payload.panel]: action.payload.expanded };
    },
    setInferenceTab(state, action: PayloadAction<InferenceTab>) {
      state.inferenceTab = action.payload;
    },
    applyPreset(state, action: PayloadAction<string>) {
      const preset = state.presets.find((p) => p.id === action.payload);
      if (!preset) return;
      // CONFIG-026: merge over defaults AND strip unknown keys against
      // KNOWN_CONFIG_KEYS so a preset persisted with obsolete fields can't
      // resurrect them on apply. Defaults give selectors a non-undefined
      // value for any field added since the preset was last saved.
      const cleaned = pickKnownConfigFields(preset.config);
      const merged: InferenceConfig = { ...DEFAULT_INFERENCE_CONFIG, ...cleaned };
      state.config = merged as unknown as ChatConfigState['config'];
      state.currentPresetId = preset.id;
    },
    saveAsPreset(state, action: PayloadAction<string>) {
      // CONFIG-009: dedupe against existing names (built-ins included). The
      // safe behavior is auto-suffix " (1)" rather than reject — keeps the
      // user's flow uninterrupted.
      // CONFIG-026: strip unknown keys before persisting so obsolete fields
      // don't get baked into a new preset that ignored migrations.
      const name = uniquePresetName(action.payload, state.presets);
      const cleaned = pickKnownConfigFields(state.config);
      const safeConfig = { ...DEFAULT_INFERENCE_CONFIG, ...cleaned };
      const preset: Preset = {
        id: newPresetId(),
        name,
        builtIn: false,
        config: safeConfig as unknown as InferenceConfig,
      };
      state.presets = [...state.presets, preset];
      state.currentPresetId = preset.id;
    },
    deletePreset(state, action: PayloadAction<string>) {
      const target = state.presets.find((p) => p.id === action.payload);
      // Built-ins are never deletable.
      if (!target || target.builtIn) return;
      state.presets = state.presets.filter((p) => p.id !== action.payload);
      // CONFIG-011: if we just deleted the active preset, fall back to the
      // built-in Default rather than orphaning the config in "Custom" with
      // no clear way back. The merged Default values become live; if the
      // user made local edits they'll be discarded, which is the explicit
      // semantics of deleting the preset that was holding them.
      if (state.currentPresetId === action.payload) {
        const fallback = state.presets.find((p) => p.id === DEFAULT_PRESET_ID);
        if (fallback) {
          const cleaned = pickKnownConfigFields(fallback.config);
          state.config = {
            ...DEFAULT_INFERENCE_CONFIG,
            ...cleaned,
          } as unknown as ChatConfigState['config'];
          state.currentPresetId = fallback.id;
        } else {
          state.currentPresetId = '';
        }
      }
    },
    toggleIntegration(state, action: PayloadAction<string>) {
      const id = action.payload;
      // CONFIG-021: only allow enabling ids that exist in availableIntegrations.
      // Toggling off works even for orphans (defensive — they shouldn't be
      // there in the first place).
      const known = state.availableIntegrations.some((i) => i.id === id);
      if (state.enabledIntegrationIds.includes(id)) {
        state.enabledIntegrationIds = state.enabledIntegrationIds.filter((x) => x !== id);
      } else if (known) {
        state.enabledIntegrationIds = [...state.enabledIntegrationIds, id];
      }
    },
    installIntegration(
      state,
      action: PayloadAction<{ name: string; description: string }>,
    ) {
      // CONFIG-019: integration install/toggle survives reload because
      // `chatConfig` is whitelisted in src/app/store/persist.ts. The slice
      // mutation here is the redux-persist source of truth — no separate
      // KvStore write needed.
      const id = `plugin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      state.availableIntegrations = [
        ...state.availableIntegrations,
        {
          id,
          name: action.payload.name.trim() || 'Untitled plugin',
          description: action.payload.description.trim() || 'User-installed plugin',
          userInstalled: true,
        },
      ];
      state.enabledIntegrationIds = [...state.enabledIntegrationIds, id];
    },
    uninstallIntegration(state, action: PayloadAction<string>) {
      const id = action.payload;
      const target = state.availableIntegrations.find((i) => i.id === id);
      if (!target?.userInstalled) return;
      state.availableIntegrations = state.availableIntegrations.filter((i) => i.id !== id);
      state.enabledIntegrationIds = state.enabledIntegrationIds.filter((x) => x !== id);
    },
    // CONFIG-021: called from a rehydrate effect to drop any persisted enabled
    // ids that no longer point at a known available integration. Keeps the
    // toggle list and the enabled set in sync after migrations / uninstalls
    // that ran in another tab / app session.
    reconcileIntegrations(state) {
      const knownIds = new Set(state.availableIntegrations.map((i) => i.id));
      state.enabledIntegrationIds = state.enabledIntegrationIds.filter((id) => knownIds.has(id));
    },
    setReasoningEnabled(state, action: PayloadAction<boolean>) {
      state.reasoningEnabled = action.payload;
    },
    setChatListCompact(state, action: PayloadAction<boolean>) {
      state.chatListCompact = action.payload;
    },
    // Bump the per-panel scroll-request counter so the matching panel
    // component scrolls itself into view. Tolerates rehydrated state that
    // predates the field.
    requestPanelScroll(state, action: PayloadAction<PanelKey>) {
      const current = state.panelScrollRequest ?? {
        systemPrompt: 0,
        modelSettings: 0,
        sampling: 0,
        structuredOutput: 0,
        speculativeDecoding: 0,
        notes: 0,
      };
      state.panelScrollRequest = {
        ...current,
        [action.payload]: (current[action.payload] ?? 0) + 1,
      };
    },
  },
});

export const {
  setConfigField,
  togglePanel,
  setPanelExpanded,
  setInferenceTab,
  applyPreset,
  saveAsPreset,
  deletePreset,
  toggleIntegration,
  installIntegration,
  uninstallIntegration,
  reconcileIntegrations,
  setReasoningEnabled,
  setChatListCompact,
  requestPanelScroll,
} = chatConfigSlice.actions;
export const chatConfigReducer = chatConfigSlice.reducer;
