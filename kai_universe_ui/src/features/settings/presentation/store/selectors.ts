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
} from './slice';
import type { RootState } from '@shared/store/hooks';

export const selectSettings = (state: RootState): SettingsState => state.settings;
export const selectLanguage = (state: RootState): SupportedLanguage =>
  state.settings.language;
export const selectServerEnabled = (state: RootState): boolean =>
  state.settings.serverEnabled;
export const selectServerPort = (state: RootState): number => state.settings.serverPort;
export const selectServeOnLocalNetwork = (state: RootState): boolean =>
  state.settings.serveOnLocalNetwork;
export const selectRuntimeAutoUpdate = (state: RootState): boolean =>
  state.settings.runtimeAutoUpdate;
export const selectRemoteEnabled = (state: RootState): boolean =>
  state.settings.remoteEnabled;
export const selectRequireAuth = (state: RootState): boolean =>
  state.settings.requireAuth;
export const selectAllowPerRequestMcps = (state: RootState): boolean =>
  state.settings.allowPerRequestMcps;
export const selectAllowMcpJsonServers = (state: RootState): boolean =>
  state.settings.allowMcpJsonServers;
export const selectEnableCors = (state: RootState): boolean =>
  state.settings.enableCors;
export const selectJitModelLoading = (state: RootState): boolean =>
  state.settings.jitModelLoading;
export const selectAutoUnloadJit = (state: RootState): boolean =>
  state.settings.autoUnloadJit;
export const selectMaxIdleTtlMinutes = (state: RootState): number =>
  state.settings.maxIdleTtlMinutes;
export const selectOnlyKeepLastJitModel = (state: RootState): boolean =>
  state.settings.onlyKeepLastJitModel;

// General panel
export const selectUpdateChannel = (state: RootState): UpdateChannel =>
  state.settings.updateChannel;
export const selectUpdateState = (state: RootState): UpdateState =>
  state.settings.updateState;
export const selectModelsDirectory = (state: RootState): string =>
  state.settings.modelsDirectory;
export const selectOpenDownloadsPaneOnDownload = (state: RootState): boolean =>
  state.settings.openDownloadsPaneOnDownload;
export const selectAlwaysOpenFullModelLoader = (state: RootState): boolean =>
  state.settings.alwaysOpenFullModelLoader;
export const selectAlwaysShowFullModelFileName = (state: RootState): boolean =>
  state.settings.alwaysShowFullModelFileName;
export const selectUseHuggingFaceProxy = (state: RootState): boolean =>
  state.settings.useHuggingFaceProxy;
export const selectPresetConfirmation = (state: RootState): boolean =>
  state.settings.presetConfirmation;

// Appearance panel
export const selectNavBarPosition = (state: RootState): NavBarPosition =>
  state.settings.navBarPosition;
export const selectChatViewMode = (state: RootState): ChatViewMode =>
  state.settings.chatViewMode;
export const selectShowTabStripScrollbar = (state: RootState): boolean =>
  state.settings.showTabStripScrollbar;
export const selectChatFontSize = (state: RootState): number =>
  state.settings.chatFontSize;
export const selectChatFontWeight = (state: RootState): ChatFontWeight =>
  state.settings.chatFontWeight;
export const selectShowGenInfo = (state: RootState): ShowGenInfo =>
  state.settings.showGenInfo;
export const selectScrollMessageToTopOnSend = (state: RootState): boolean =>
  state.settings.scrollMessageToTopOnSend;
export const selectAutoLatchOntoGeneratingMessage = (state: RootState): boolean =>
  state.settings.autoLatchOntoGeneratingMessage;
export const selectChatMessagesStyle = (state: RootState): ChatMessagesStyle =>
  state.settings.chatMessagesStyle;
export const selectExpandChatContainerToWindowWidth = (state: RootState): boolean =>
  state.settings.expandChatContainerToWindowWidth;
export const selectExpandReasoningBlocksByDefault = (state: RootState): boolean =>
  state.settings.expandReasoningBlocksByDefault;
export const selectShowReasoningBlockVignette = (state: RootState): boolean =>
  state.settings.showReasoningBlockVignette;
export const selectOnboardingHintsSettings = (state: RootState): readonly string[] =>
  state.settings.onboardingHints;

// Developer panel
export const selectDeveloperModeEnabled = (state: RootState): boolean =>
  state.settings.developerModeEnabled;
export const selectEnableLocalLlmService = (state: RootState): boolean =>
  state.settings.enableLocalLlmService;
export const selectRuntimeDownloadChannel = (state: RootState): RuntimeDownloadChannel =>
  state.settings.runtimeDownloadChannel;
export const selectAutoDeleteLruRuntimePacks = (state: RootState): boolean =>
  state.settings.autoDeleteLruRuntimePacks;
export const selectShowDebugInfoBlocks = (state: RootState): boolean =>
  state.settings.showDebugInfoBlocks;
export const selectShowResourceConsumptionWidget = (state: RootState): boolean =>
  state.settings.showResourceConsumptionWidget;
export const selectEnableModelLoadConfigInPresets = (state: RootState): boolean =>
  state.settings.enableModelLoadConfigInPresets;
export const selectSeparateReasoningContent = (state: RootState): boolean =>
  state.settings.separateReasoningContent;

// Chat panel
export const selectAllowOnlyOneNewEmptyChat = (state: RootState): boolean =>
  state.settings.allowOnlyOneNewEmptyChat;
export const selectUnloadCurrentModelOnSelect = (state: RootState): boolean =>
  state.settings.unloadCurrentModelOnSelect;
export const selectMoveDeletedChatsToTrash = (state: RootState): boolean =>
  state.settings.moveDeletedChatsToTrash;
export const selectDoubleClickToEditMessage = (state: RootState): boolean =>
  state.settings.doubleClickToEditMessage;
export const selectShowTokenCountInChatListings = (state: RootState): boolean =>
  state.settings.showTokenCountInChatListings;
export const selectAlwaysShowPromptTemplateInSidebar = (state: RootState): boolean =>
  state.settings.alwaysShowPromptTemplateInSidebar;
export const selectDoubleClickChatFolderRenames = (state: RootState): boolean =>
  state.settings.doubleClickChatFolderRenames;
export const selectSidebarSort = (state: RootState): SidebarSort =>
  state.settings.sidebarSort;
export const selectSidebarSortOrder = (state: RootState): SidebarSortOrder =>
  state.settings.sidebarSortOrder;
export const selectShiftEnterToSend = (state: RootState): boolean =>
  state.settings.shiftEnterToSend;
export const selectCmdRToRegenerate = (state: RootState): boolean =>
  state.settings.cmdRToRegenerate;
export const selectAiGeneratedChatNames = (state: RootState): AiGeneratedChatNames =>
  state.settings.aiGeneratedChatNames;

// Model defaults panel
export const selectNeverExceedImagePx = (state: RootState): boolean =>
  state.settings.neverExceedImagePx;
export const selectMaxImagePx = (state: RootState): number =>
  state.settings.maxImagePx;
export const selectDefaultContextLength = (state: RootState): DefaultContextLength =>
  state.settings.defaultContextLength;
export const selectCustomContextLength = (state: RootState): number =>
  state.settings.customContextLength;
export const selectModelLoadingGuardrails = (state: RootState): ModelLoadingGuardrails =>
  state.settings.modelLoadingGuardrails;
export const selectBypassMemoryLoadWarnings = (state: RootState): BypassMemoryLoadWarnings =>
  state.settings.bypassMemoryLoadWarnings;

// LM Link panel
export const selectAllowLoadingModelsOnThisMachine = (state: RootState): boolean =>
  state.settings.allowLoadingModelsOnThisMachine;
export const selectDeviceName = (state: RootState): string =>
  state.settings.deviceName;
export const selectDeviceIdentifier = (state: RootState): string =>
  state.settings.deviceIdentifier;

// Runtime panel
export const selectGgufRuntimeId = (state: RootState): string =>
  state.settings.ggufRuntimeId;
export const selectMlxRuntimeId = (state: RootState): string =>
  state.settings.mlxRuntimeId;
export const selectEngineCompatFilter = (state: RootState): EngineCompatFilter =>
  state.settings.engineCompatFilter;
export const selectEngineKindFilter = (state: RootState): EngineKindFilter =>
  state.settings.engineKindFilter;
export const selectEngineStates = (
  state: RootState,
): Readonly<Record<string, EngineRuntimeState>> => state.settings.engineStates;
export const selectRuntimeUpdateState = (state: RootState): UpdateState =>
  state.settings.runtimeUpdateState;

// Hardware panel
export const selectGpuEnabled = (state: RootState): boolean =>
  state.settings.gpuEnabled;

// Integrations panel
export const selectAllowedToolIds = (state: RootState): readonly string[] =>
  state.settings.allowedToolIds;
