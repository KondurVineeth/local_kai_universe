import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { SEED_API_TOKENS, type ApiToken } from '../../domain/entities/ApiToken';

import type { LogEntry } from '../../domain/entities/LogEntry';
import type { EndpointsTab } from '../../domain/value-objects/EndpointsTab';
import type { FileLoggingMode } from '../../domain/value-objects/FileLoggingMode';
import type { ServerStatus } from '../../domain/value-objects/ServerStatus';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

export type { LogEntry } from '../../domain/entities/LogEntry';
export type { EndpointsTab } from '../../domain/value-objects/EndpointsTab';
export type { FileLoggingMode } from '../../domain/value-objects/FileLoggingMode';
export type { ServerStatus } from '../../domain/value-objects/ServerStatus';
export type { ApiToken } from '../../domain/entities/ApiToken';

export type RightRailTab = 'info' | 'load' | 'inference';

// Persisted Load-tab knobs. Kept in the slice (not ephemeral component
// state) so values survive tab switches and reload — see audit MEDIUM
// item on LoadTab/InferenceTab config persistence.
export interface LoadConfig {
  contextLength: number;
  gpuOffloadPct: number;
  cpuThreads: number;
  evalBatchSize: number;
  maxConcurrentPredictions: number;
}

// Persisted Inference-tab knobs.
export interface InferenceConfig {
    systemPrompt: string;
    temperature: number;
    topK: number;
    topP: number;
    repetitionPenalty: number;
    presencePenalty: number;
    minP: number;
    draftModelId: string | null;
}

export const DEFAULT_LOAD_CONFIG: LoadConfig = {
  contextLength: 4096,
  gpuOffloadPct: 42,
  cpuThreads: 7,
  evalBatchSize: 512,
  maxConcurrentPredictions: 4,
};

export const DEFAULT_INFERENCE_CONFIG: InferenceConfig = {
  systemPrompt: '',
  temperature: 1,
  topK: 64,
  topP: 0.95,
  repetitionPenalty: 1.1,
  presencePenalty: 0,
  minP: 0.05,
  draftModelId: null,
};

export interface LocalServerState {
  _initialized: boolean;
  endpointsTab: EndpointsTab;
  endpointsCollapsed: boolean;
  logsCollapsed: boolean;
  verboseLogging: boolean;
  redactContent: boolean;
  logIncomingTokens: boolean;
  fileLoggingMode: FileLoggingMode;
  serverSettingsOpen: boolean;
  manageTokensOpen: boolean;
  mcpJsonOpen: boolean;
  mcpJsonContent: string;
  selectedModelId: ModelId | null;
  rightRailTab: RightRailTab;
  logs: LogEntry[];
  lastApiResponse: {
    endpoint: string;
    method: string;
    status: number;
    body: unknown;
  } | null;
  // Lifecycle: stopped → starting → running → stopping → stopped.
  // Owned here rather than in settings because settings' `serverEnabled`
  // is the user's persisted intent, while `serverStatus` is the live
  // simulator state (transient, never persisted). The mock has no failure
  // simulation, so 'error' is unreachable by design.
  serverStatus: ServerStatus;
  // Wall-clock when the server entered 'running'. Drives the uptime
  // counter in the sidebar vitals card. Null whenever not running.
  serverStartedAt: string | null;
  // Cumulative request count since this run. Resets on stop.
  requestCount: number;
  // When true, the simulator emits a synthetic request every 5-8s while
  // the server is running. Used for demos so the log panel feels alive
  // even when the user isn't sending chat messages.
  syntheticTrafficEnabled: boolean;
  // API tokens for authenticated endpoints. Seeded with fixtures so the
  // Manage Tokens screen has realistic content on first open.
  apiTokens: ApiToken[];
  // Right-rail Load / Inference config. Persisted so the values stick
  // across tab switches and reload (full apply-to-load is out of scope).
  loadConfig: LoadConfig;
  inferenceConfig: InferenceConfig;
}

const DEFAULT_MCP_JSON = `{
  "mcpServers": {}
}`;

const initialState: LocalServerState = {
  _initialized: false,
  endpointsTab: 'zl-universe',
  endpointsCollapsed: false,
  logsCollapsed: false,
  verboseLogging: false,
  redactContent: false,
  logIncomingTokens: false,
  fileLoggingMode: 'off',
  serverSettingsOpen: false,
  manageTokensOpen: false,
  mcpJsonOpen: false,
  mcpJsonContent: DEFAULT_MCP_JSON,
  selectedModelId: null,
  rightRailTab: 'info',
  logs: [],
  lastApiResponse: null,
  serverStatus: 'stopped',
  serverStartedAt: null,
  requestCount: 0,
  syntheticTrafficEnabled: false,
  apiTokens: [...SEED_API_TOKENS],
  loadConfig: { ...DEFAULT_LOAD_CONFIG },
  inferenceConfig: { ...DEFAULT_INFERENCE_CONFIG },
};

// Display-only masked secret for a freshly-minted mock token.
function randomSecretPreview(): string {
  const tail = Math.random().toString(16).slice(2, 6).padEnd(4, '0');
  return `zlu_sk_••••••${tail}`;
}

export const localServerSlice = createSlice({
  name: 'localServer',
  initialState,
  reducers: {
    initialized(state) {
      state._initialized = true;
    },
    endpointsTabSet(state, action: PayloadAction<EndpointsTab>) {
      state.endpointsTab = action.payload;
    },
    endpointsCollapsedToggled(state) {
      state.endpointsCollapsed = !state.endpointsCollapsed;
    },
    logsCollapsedToggled(state) {
      state.logsCollapsed = !state.logsCollapsed;
    },
    verboseLoggingToggled(state) {
      state.verboseLogging = !state.verboseLogging;
    },
    redactContentToggled(state) {
      state.redactContent = !state.redactContent;
    },
    logIncomingTokensToggled(state) {
      state.logIncomingTokens = !state.logIncomingTokens;
    },
    fileLoggingModeSet(state, action: PayloadAction<FileLoggingMode>) {
      state.fileLoggingMode = action.payload;
    },
    serverSettingsOpenSet(state, action: PayloadAction<boolean>) {
      state.serverSettingsOpen = action.payload;
    },
    manageTokensOpenSet(state, action: PayloadAction<boolean>) {
      state.manageTokensOpen = action.payload;
    },
    mcpJsonOpenSet(state, action: PayloadAction<boolean>) {
      state.mcpJsonOpen = action.payload;
    },
    mcpJsonContentSet(state, action: PayloadAction<string>) {
      state.mcpJsonContent = action.payload;
    },
    selectedModelSet(state, action: PayloadAction<ModelId | null>) {
      state.selectedModelId = action.payload;
    },
    rightRailTabSet(state, action: PayloadAction<RightRailTab>) {
      state.rightRailTab = action.payload;
    },
    logsCleared(state) {
      state.logs = [];
    },
    logAppended(state, action: PayloadAction<LogEntry>) {
      state.logs = [...state.logs, action.payload];
    },
    logsReplaced(state, action: PayloadAction<LogEntry[]>) {
      state.logs = action.payload;
    },
    apiResponseReceived(state, action: PayloadAction<{endpoint: string; method: string; status: number; body: unknown;}>,) {
      state.lastApiResponse = action.payload;
    },
    
    serverStarting(state) {
      state.serverStatus = 'starting';
      state.serverStartedAt = null;
      state.requestCount = 0;
    },
    serverStarted(state) {
      state.serverStatus = 'running';
      state.serverStartedAt = new Date().toISOString();
    },
    serverInfoUpdated(
      state,
      action: PayloadAction<{
        status: string;
        started_at: string | null;
        request_count: number;
      }>,
    ) {
      state.serverStatus = action.payload.status as ServerStatus;
      state.serverStartedAt = action.payload.started_at;
      state.requestCount = action.payload.request_count;
    },
    serverStopping(state) {
      state.serverStatus = 'stopping';
    },
    serverStopped(state) {
      state.serverStatus = 'stopped';
      state.serverStartedAt = null;
    },
    requestCountIncremented(state) {
      state.requestCount += 1;
    },
    syntheticTrafficToggled(state) {
      state.syntheticTrafficEnabled = !state.syntheticTrafficEnabled;
    },
    // --- API token management ---
    apiTokenCreated(state, action: PayloadAction<{ readonly label: string }>) {
      const label = action.payload.label.trim() || 'Untitled key';
      state.apiTokens = [
        {
          id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label,
          secretPreview: randomSecretPreview(),
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          revoked: false,
        },
        ...state.apiTokens,
      ];
    },
    apiTokenRevoked(state, action: PayloadAction<string>) {
      state.apiTokens = state.apiTokens.map((t) =>
        t.id === action.payload ? { ...t, revoked: true } : t,
      );
    },
    apiTokenDeleted(state, action: PayloadAction<string>) {
      state.apiTokens = state.apiTokens.filter((t) => t.id !== action.payload);
    },
    // --- Load / Inference config ---
    loadConfigChanged(state, action: PayloadAction<Partial<LoadConfig>>) {
      state.loadConfig = { ...state.loadConfig, ...action.payload };
    },
    loadConfigReset(state) {
      state.loadConfig = { ...DEFAULT_LOAD_CONFIG };
    },
    inferenceConfigChanged(state, action: PayloadAction<Partial<InferenceConfig>>) {
      state.inferenceConfig = { ...state.inferenceConfig, ...action.payload };
    },
    inferenceConfigReset(state) {
      state.inferenceConfig = { ...DEFAULT_INFERENCE_CONFIG };
    },
  },
});

export const {
  initialized,
  endpointsTabSet,
  endpointsCollapsedToggled,
  logsCollapsedToggled,
  verboseLoggingToggled,
  redactContentToggled,
  logIncomingTokensToggled,
  fileLoggingModeSet,
  serverSettingsOpenSet,
  manageTokensOpenSet,
  mcpJsonOpenSet,
  mcpJsonContentSet,
  selectedModelSet,
  rightRailTabSet,
  logsCleared,
  logAppended,
  logsReplaced,
  apiResponseReceived,
  serverStarting,
  serverStarted,
  serverInfoUpdated,
  serverStopping,
  serverStopped,
  requestCountIncremented,
  syntheticTrafficToggled,
  apiTokenCreated,
  apiTokenRevoked,
  apiTokenDeleted,
  loadConfigChanged,
  loadConfigReset,
  inferenceConfigChanged,
  inferenceConfigReset,
} = localServerSlice.actions;

export const localServerReducer = localServerSlice.reducer;
