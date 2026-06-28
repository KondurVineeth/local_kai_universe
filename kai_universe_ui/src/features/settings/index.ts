import { settingsRoutes } from './presentation/routes';
import { initialSettingsState, settingsReducer, settingsSlice } from './presentation/store/slice';

import type {
  AiGeneratedChatNames,
  BypassMemoryLoadWarnings,
  ChatFontWeight,
  ChatMessagesStyle,
  ChatViewMode,
  DefaultContextLength,
  EngineCompatFilter,
  EngineKindFilter,
  EngineRuntimeState,
  ModelLoadingGuardrails,
  NavBarPosition,
  RuntimeDownloadChannel,
  SettingsState,
  ShowGenInfo,
  SidebarSort,
  SidebarSortOrder,
  SupportedLanguage,
  UpdateChannel,
  UpdateState,
} from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';


export interface SettingsContainer {
  readonly _settingsMarker?: undefined;
}

export function wireSettingsContainer(_shared: SharedContainer): SettingsContainer {
  return {};
}

// Augment the global Container type with this feature's slice.
declare module '@shared/container' {
  interface ContainerExtensions {
    readonly settings: SettingsContainer;
  }
}

// Register this feature's slice on the global RootStateShape.
declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly settings: SettingsState;
  }
}


// Public surface — only barrel-level exports
export { settingsReducer, settingsSlice, initialSettingsState };
export { settingsRoutes };
export {
  selectSettings,
  selectLanguage,
  selectServerEnabled,
  selectServerPort,
  selectServeOnLocalNetwork,
  selectRuntimeAutoUpdate,
  selectRemoteEnabled,
  selectRequireAuth,
  selectAllowPerRequestMcps,
  selectAllowMcpJsonServers,
  selectEnableCors,
  selectJitModelLoading,
  selectAutoUnloadJit,
  selectMaxIdleTtlMinutes,
  selectOnlyKeepLastJitModel,
  // General panel
  selectUpdateChannel,
  selectUpdateState,
  selectModelsDirectory,
  selectOpenDownloadsPaneOnDownload,
  selectAlwaysOpenFullModelLoader,
  selectAlwaysShowFullModelFileName,
  selectUseHuggingFaceProxy,
  selectPresetConfirmation,
  // Appearance panel
  selectNavBarPosition,
  selectChatViewMode,
  selectShowTabStripScrollbar,
  selectChatFontSize,
  selectChatFontWeight,
  selectShowGenInfo,
  selectScrollMessageToTopOnSend,
  selectAutoLatchOntoGeneratingMessage,
  selectChatMessagesStyle,
  selectExpandChatContainerToWindowWidth,
  selectExpandReasoningBlocksByDefault,
  selectShowReasoningBlockVignette,
  selectOnboardingHintsSettings,
  // Developer panel
  selectDeveloperModeEnabled,
  selectEnableLocalLlmService,
  selectRuntimeDownloadChannel,
  selectAutoDeleteLruRuntimePacks,
  selectShowDebugInfoBlocks,
  selectShowResourceConsumptionWidget,
  selectEnableModelLoadConfigInPresets,
  selectSeparateReasoningContent,
  // Chat panel
  selectAllowOnlyOneNewEmptyChat,
  selectUnloadCurrentModelOnSelect,
  selectMoveDeletedChatsToTrash,
  selectDoubleClickToEditMessage,
  selectShowTokenCountInChatListings,
  selectAlwaysShowPromptTemplateInSidebar,
  selectDoubleClickChatFolderRenames,
  selectSidebarSort,
  selectSidebarSortOrder,
  selectShiftEnterToSend,
  selectCmdRToRegenerate,
  selectAiGeneratedChatNames,
  // Model defaults panel
  selectNeverExceedImagePx,
  selectMaxImagePx,
  selectDefaultContextLength,
  selectCustomContextLength,
  selectModelLoadingGuardrails,
  selectBypassMemoryLoadWarnings,
  // LM Link panel
  selectAllowLoadingModelsOnThisMachine,
  selectDeviceName,
  selectDeviceIdentifier,
  // Runtime panel
  selectGgufRuntimeId,
  selectMlxRuntimeId,
  selectEngineCompatFilter,
  selectEngineKindFilter,
  selectEngineStates,
  selectRuntimeUpdateState,
  // Hardware panel
  selectGpuEnabled,
  // Integrations panel
  selectAllowedToolIds,
} from './presentation/store/selectors';
export {
  languageChanged,
  serverEnabledChanged,
  serverPortChanged,
  serveOnLocalNetworkChanged,
  runtimeAutoUpdateChanged,
  remoteEnabledChanged,
  requireAuthChanged,
  allowPerRequestMcpsChanged,
  allowMcpJsonServersChanged,
  enableCorsChanged,
  jitModelLoadingChanged,
  autoUnloadJitChanged,
  maxIdleTtlMinutesChanged,
  onlyKeepLastJitModelChanged,
  SUPPORTED_LANGUAGES,
  // General panel
  updateChannelChanged,
  updateCheckStarted,
  updateCheckResolved,
  modelsDirectoryChanged,
  modelsDirectoryReset,
  openDownloadsPaneOnDownloadChanged,
  alwaysOpenFullModelLoaderChanged,
  alwaysShowFullModelFileNameChanged,
  useHuggingFaceProxyChanged,
  presetConfirmationChanged,
  // Appearance panel
  navBarPositionChanged,
  chatViewModeChanged,
  showTabStripScrollbarChanged,
  chatFontSizeChanged,
  chatFontWeightChanged,
  showGenInfoChanged,
  scrollMessageToTopOnSendChanged,
  autoLatchOntoGeneratingMessageChanged,
  chatMessagesStyleChanged,
  expandChatContainerToWindowWidthChanged,
  expandReasoningBlocksByDefaultChanged,
  showReasoningBlockVignetteChanged,
  onboardingHintRemoved,
  onboardingHintsReset,
  // Developer panel
  developerModeEnabledChanged,
  enableLocalLlmServiceChanged,
  runtimeDownloadChannelChanged,
  autoDeleteLruRuntimePacksChanged,
  showDebugInfoBlocksChanged,
  showResourceConsumptionWidgetChanged,
  enableModelLoadConfigInPresetsChanged,
  separateReasoningContentChanged,
  // Chat panel
  allowOnlyOneNewEmptyChatChanged,
  unloadCurrentModelOnSelectChanged,
  moveDeletedChatsToTrashChanged,
  doubleClickToEditMessageChanged,
  showTokenCountInChatListingsChanged,
  alwaysShowPromptTemplateInSidebarChanged,
  doubleClickChatFolderRenamesChanged,
  sidebarSortChanged,
  sidebarSortOrderChanged,
  shiftEnterToSendChanged,
  cmdRToRegenerateChanged,
  aiGeneratedChatNamesChanged,
  // Model defaults panel
  neverExceedImagePxChanged,
  maxImagePxChanged,
  defaultContextLengthChanged,
  customContextLengthChanged,
  modelLoadingGuardrailsChanged,
  bypassMemoryLoadWarningsChanged,
  // LM Link panel
  allowLoadingModelsOnThisMachineChanged,
  deviceNameChanged,
  // Runtime panel
  ggufRuntimeChanged,
  mlxRuntimeChanged,
  engineCompatFilterChanged,
  engineKindFilterChanged,
  engineUpdated,
  engineRemoved,
  engineRestored,
  runtimeUpdateCheckStarted,
  runtimeUpdateCheckResolved,
  // Hardware panel
  gpuEnabledChanged,
  gpuReset,
  // Integrations panel
  toolAllowed,
  toolDisallowed,
} from './presentation/store/slice';
export { ENGINE_FIXTURES } from './infrastructure/fixtures/engines';
export type { EngineFixture, EngineKindTag } from './infrastructure/fixtures/engines';
export { INTEGRATION_TOOL_CATALOG } from './infrastructure/fixtures/integrations';
export type { IntegrationToolFixture } from './infrastructure/fixtures/integrations';
export type {
  SettingsState,
  SupportedLanguage,
  NavBarPosition,
  ChatViewMode,
  ChatFontWeight,
  ShowGenInfo,
  ChatMessagesStyle,
  RuntimeDownloadChannel,
  AiGeneratedChatNames,
  SidebarSort,
  SidebarSortOrder,
  DefaultContextLength,
  ModelLoadingGuardrails,
  BypassMemoryLoadWarnings,
  UpdateChannel,
  UpdateState,
  EngineCompatFilter,
  EngineKindFilter,
  EngineRuntimeState,
};
