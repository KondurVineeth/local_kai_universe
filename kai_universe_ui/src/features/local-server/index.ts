import { localServerRoutes } from './presentation/routes';
import { localServerReducer, localServerSlice } from './presentation/store/slice';

import type { LocalServerState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';
import { HttpLocalServerService } from '@shared/infrastructure/repositories/HttpLocalServerService';


export interface LocalServerContainer {
  readonly localServerService: HttpLocalServerService;
}

export function wireLocalServerContainer(
  _shared: SharedContainer,
): LocalServerContainer {
  return {
    localServerService: new HttpLocalServerService(),
  };
}

declare module '@shared/container' {
  interface ContainerExtensions {
    readonly localServer: LocalServerContainer;
  }
}

declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly localServer: LocalServerState;
  }
}


export { localServerReducer, localServerSlice };
export { localServerRoutes };
export { LocalServerRightRailSlot } from './presentation/components/LocalServerRightRailSlot';
export {
  selectLocalServerInitialized,
  selectEndpointsTab,
  selectEndpointsCollapsed,
  selectLogsCollapsed,
  selectVerboseLogging,
  selectRedactContent,
  selectLogIncomingTokens,
  selectFileLoggingMode,
  selectServerSettingsOpen,
  selectManageTokensOpen,
  selectMcpJsonOpen,
  selectMcpJsonContent,
  selectSelectedModelId,
  selectRightRailTab,
  selectLogs,
  selectServerStatus,
  selectServerStartedAt,
  selectServerRequestCount,
  selectSyntheticTrafficEnabled,
  selectApiTokens,
  selectActiveApiTokenCount,
  selectLoadConfig,
  selectInferenceConfig,
} from './presentation/store/selectors';
export {
  simulateRequestThunk,
  startServerThunk,
  stopServerThunk,
} from './presentation/store/thunks';
export type { SimulatedRequest } from './presentation/store/thunks';
export {
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
  syntheticTrafficToggled,
  apiTokenCreated,
  apiTokenRevoked,
  apiTokenDeleted,
  loadConfigChanged,
  loadConfigReset,
  inferenceConfigChanged,
  inferenceConfigReset,
} from './presentation/store/slice';
export type {
  LocalServerState,
  EndpointsTab,
  RightRailTab,
  FileLoggingMode,
  LogEntry,
  ServerStatus,
  ApiToken,
  LoadConfig,
  InferenceConfig,
} from './presentation/store/slice';
