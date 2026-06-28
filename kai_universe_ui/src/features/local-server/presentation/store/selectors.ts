import type {
  ApiToken,
  EndpointsTab,
  FileLoggingMode,
  InferenceConfig,
  LoadConfig,
  LogEntry,
  RightRailTab,
  ServerStatus,
} from './slice';
import type { ModelId } from '@shared/domain/model/value-objects/ModelId';
import type { RootState } from '@shared/store/hooks';

export const selectLocalServerInitialized = (state: RootState): boolean =>
  state.localServer._initialized;

export const selectEndpointsTab = (state: RootState): EndpointsTab =>
  state.localServer.endpointsTab;

export const selectEndpointsCollapsed = (state: RootState): boolean =>
  state.localServer.endpointsCollapsed;

export const selectLogsCollapsed = (state: RootState): boolean =>
  state.localServer.logsCollapsed;

export const selectVerboseLogging = (state: RootState): boolean =>
  state.localServer.verboseLogging;

export const selectRedactContent = (state: RootState): boolean =>
  state.localServer.redactContent;

export const selectLogIncomingTokens = (state: RootState): boolean =>
  state.localServer.logIncomingTokens;

export const selectFileLoggingMode = (state: RootState): FileLoggingMode =>
  state.localServer.fileLoggingMode;

export const selectServerSettingsOpen = (state: RootState): boolean =>
  state.localServer.serverSettingsOpen;

export const selectManageTokensOpen = (state: RootState): boolean =>
  state.localServer.manageTokensOpen;

export const selectMcpJsonOpen = (state: RootState): boolean =>
  state.localServer.mcpJsonOpen;

export const selectMcpJsonContent = (state: RootState): string =>
  state.localServer.mcpJsonContent;

export const selectSelectedModelId = (state: RootState): ModelId | null =>
  state.localServer.selectedModelId;

export const selectRightRailTab = (state: RootState): RightRailTab =>
  state.localServer.rightRailTab;

export const selectLogs = (state: RootState): readonly LogEntry[] =>
  state.localServer.logs;

export const selectServerStatus = (state: RootState): ServerStatus =>
  state.localServer.serverStatus;

export const selectServerStartedAt = (state: RootState): string | null =>
  state.localServer.serverStartedAt;

export const selectServerRequestCount = (state: RootState): number =>
  state.localServer.requestCount;

export const selectSyntheticTrafficEnabled = (state: RootState): boolean =>
  state.localServer.syntheticTrafficEnabled;

export const selectApiTokens = (state: RootState): readonly ApiToken[] =>
  state.localServer.apiTokens;

// Count of non-revoked tokens — drives the "Active API Keys: N" line in
// the Server Settings popover.
export const selectActiveApiTokenCount = (state: RootState): number =>
  state.localServer.apiTokens.filter((t) => !t.revoked).length;

export const selectLoadConfig = (state: RootState): LoadConfig =>
  state.localServer.loadConfig;

export const selectInferenceConfig = (state: RootState): InferenceConfig =>
  state.localServer.inferenceConfig;

export const selectLastApiResponse = (state: RootState) =>
  state.localServer.lastApiResponse;