import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Curated subset of ZL Universe's ~30 supported locales — covers the most
// commonly-asked-for ones and demonstrates the dropdown behaviour without
// committing to a full localization fixture.
export const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
  { value: 'ru', label: 'Русский' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ar', label: 'العربية' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['value'];

export type NavBarPosition = 'left' | 'right';
export type ChatViewMode = 'markdown' | 'plain';
export type ChatFontWeight = 'normal' | 'medium' | 'bold';
export type ShowGenInfo = 'last-message-only' | 'all' | 'none';
export type ChatMessagesStyle = 'bubble' | 'block';
export type RuntimeDownloadChannel = 'stable' | 'beta';
export type AiGeneratedChatNames = 'never' | 'auto' | 'always';
export type SidebarSort = 'date-created' | 'date-modified' | 'name';
export type SidebarSortOrder = 'asc' | 'desc';
export type DefaultContextLength = 'custom' | 'model-maximum';
export type ModelLoadingGuardrails = 'off' | 'relaxed' | 'balanced' | 'strict' | 'custom';
export type BypassMemoryLoadWarnings = 'requires-alt' | 'no-restriction';
export type UpdateChannel = 'stable' | 'beta';

// App-update lifecycle. Drives the General panel's update banner: a "Check
// for updates" press transitions checking → up-to-date | available.
export type UpdateState = 'idle' | 'checking' | 'up-to-date' | 'available';

// Engine list filters for the Runtime panel's Engines section.
export type EngineCompatFilter = 'compatible' | 'all';
export type EngineKindFilter = 'all' | 'gguf' | 'mlx';

// Per-engine runtime state, keyed by engine id. Absent entry = pristine
// (installed at the fixture's `installedVersion`, not removed).
export interface EngineRuntimeState {
  readonly removed: boolean;
  // Set once the user runs "Update" on a row — engine jumps to latest.
  readonly updatedToLatest: boolean;
}

export interface SettingsState {
  readonly language: SupportedLanguage;
  // Local OpenAI-compatible HTTP server (Developer-mode only in ZL Universe).
  readonly serverEnabled: boolean;
  readonly serverPort: number;
  readonly serveOnLocalNetwork: boolean;
  // Toggles whether new llama.cpp / MLX builds get pulled in the background.
  readonly runtimeAutoUpdate: boolean;
  // Remote — Tailscale-mediated cross-device chat (Developer-mode only).
  readonly remoteEnabled: boolean;
  // Server authentication + security options.
  readonly requireAuth: boolean;
  readonly allowPerRequestMcps: boolean;
  readonly allowMcpJsonServers: boolean;
  readonly enableCors: boolean;
  // Just-in-Time model loading settings.
  readonly jitModelLoading: boolean;
  readonly autoUnloadJit: boolean;
  readonly maxIdleTtlMinutes: number;
  readonly onlyKeepLastJitModel: boolean;

  // General panel
  readonly updateChannel: UpdateChannel;
  readonly updateState: UpdateState;
  readonly openDownloadsPaneOnDownload: boolean;
  readonly alwaysOpenFullModelLoader: boolean;
  readonly alwaysShowFullModelFileName: boolean;
  readonly useHuggingFaceProxy: boolean;
  readonly presetConfirmation: boolean;
  readonly modelsDirectory: string;

  // Appearance panel
  readonly navBarPosition: NavBarPosition;
  readonly chatViewMode: ChatViewMode;
  readonly showTabStripScrollbar: boolean;
  readonly chatFontSize: number;
  readonly chatFontWeight: ChatFontWeight;
  readonly showGenInfo: ShowGenInfo;
  readonly scrollMessageToTopOnSend: boolean;
  readonly autoLatchOntoGeneratingMessage: boolean;
  readonly chatMessagesStyle: ChatMessagesStyle;
  readonly expandChatContainerToWindowWidth: boolean;
  readonly expandReasoningBlocksByDefault: boolean;
  readonly showReasoningBlockVignette: boolean;
  readonly onboardingHints: readonly string[];

  // Developer panel
  readonly developerModeEnabled: boolean;
  readonly enableLocalLlmService: boolean;
  readonly runtimeDownloadChannel: RuntimeDownloadChannel;
  readonly autoDeleteLruRuntimePacks: boolean;
  readonly showDebugInfoBlocks: boolean;
  readonly showResourceConsumptionWidget: boolean;
  readonly enableModelLoadConfigInPresets: boolean;
  readonly separateReasoningContent: boolean;

  // Chat panel
  readonly allowOnlyOneNewEmptyChat: boolean;
  readonly unloadCurrentModelOnSelect: boolean;
  readonly moveDeletedChatsToTrash: boolean;
  readonly doubleClickToEditMessage: boolean;
  readonly showTokenCountInChatListings: boolean;
  readonly alwaysShowPromptTemplateInSidebar: boolean;
  readonly doubleClickChatFolderRenames: boolean;
  readonly sidebarSort: SidebarSort;
  readonly sidebarSortOrder: SidebarSortOrder;
  readonly shiftEnterToSend: boolean;
  readonly cmdRToRegenerate: boolean;
  readonly aiGeneratedChatNames: AiGeneratedChatNames;

  // Model defaults panel
  readonly neverExceedImagePx: boolean;
  readonly maxImagePx: number;
  readonly defaultContextLength: DefaultContextLength;
  readonly customContextLength: number;
  readonly modelLoadingGuardrails: ModelLoadingGuardrails;
  readonly bypassMemoryLoadWarnings: BypassMemoryLoadWarnings;

  // LM Link panel
  readonly allowLoadingModelsOnThisMachine: boolean;
  readonly deviceName: string;
  readonly deviceIdentifier: string;

  // Runtime panel
  readonly ggufRuntimeId: string;
  readonly mlxRuntimeId: string;
  readonly engineCompatFilter: EngineCompatFilter;
  readonly engineKindFilter: EngineKindFilter;
  readonly engineStates: Readonly<Record<string, EngineRuntimeState>>;
  readonly runtimeUpdateState: UpdateState;

  // Hardware panel
  readonly gpuEnabled: boolean;

  // Integrations panel — ids of tools allowed to run without confirmation.
  readonly allowedToolIds: readonly string[];
}

export const initialSettingsState: SettingsState = {
  language: 'en',
  serverEnabled: false,
  serverPort: 1234,
  serveOnLocalNetwork: false,
  runtimeAutoUpdate: true,
  remoteEnabled: false,
  requireAuth: false,
  allowPerRequestMcps: true,
  allowMcpJsonServers: false,
  enableCors: false,
  jitModelLoading: true,
  autoUnloadJit: true,
  maxIdleTtlMinutes: 60,
  onlyKeepLastJitModel: true,

  // General panel
  updateChannel: 'stable',
  updateState: 'idle',
  openDownloadsPaneOnDownload: false,
  alwaysOpenFullModelLoader: false,
  alwaysShowFullModelFileName: false,
  useHuggingFaceProxy: true,
  presetConfirmation: false,
  modelsDirectory: '~/Library/Application Support/ZL Universe/models',

  // Appearance panel
  navBarPosition: 'left',
  chatViewMode: 'markdown',
  showTabStripScrollbar: false,
  chatFontSize: 50,
  chatFontWeight: 'normal',
  showGenInfo: 'last-message-only',
  scrollMessageToTopOnSend: true,
  autoLatchOntoGeneratingMessage: false,
  chatMessagesStyle: 'bubble',
  expandChatContainerToWindowWidth: false,
  expandReasoningBlocksByDefault: false,
  showReasoningBlockVignette: true,
  onboardingHints: ['LM Link Sidebar Button Popover', 'Trash Deletion Onboarding'],

  // Developer panel
  developerModeEnabled: false,
  enableLocalLlmService: false,
  runtimeDownloadChannel: 'stable',
  autoDeleteLruRuntimePacks: true,
  showDebugInfoBlocks: false,
  showResourceConsumptionWidget: false,
  enableModelLoadConfigInPresets: false,
  separateReasoningContent: true,

  // Chat panel
  allowOnlyOneNewEmptyChat: true,
  unloadCurrentModelOnSelect: true,
  moveDeletedChatsToTrash: true,
  doubleClickToEditMessage: false,
  showTokenCountInChatListings: false,
  alwaysShowPromptTemplateInSidebar: false,
  doubleClickChatFolderRenames: false,
  sidebarSort: 'date-created',
  sidebarSortOrder: 'desc',
  shiftEnterToSend: false,
  cmdRToRegenerate: true,
  aiGeneratedChatNames: 'auto',

  // Model defaults panel
  neverExceedImagePx: true,
  maxImagePx: 2048,
  defaultContextLength: 'custom',
  customContextLength: 4096,
  modelLoadingGuardrails: 'strict',
  bypassMemoryLoadWarnings: 'no-restriction',

  // LM Link panel
  allowLoadingModelsOnThisMachine: true,
  deviceName: 'Rokis-MacBook-Air.local',
  deviceIdentifier: 'zlu-7f3c91a8-d24e-4b06',

  // Runtime panel
  ggufRuntimeId: 'metal-llamacpp-214',
  mlxRuntimeId: 'mlx-m5-160',
  engineCompatFilter: 'compatible',
  engineKindFilter: 'all',
  engineStates: {},
  runtimeUpdateState: 'idle',

  // Hardware panel
  gpuEnabled: true,

  // Integrations panel
  allowedToolIds: [],
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    languageChanged(state, action: PayloadAction<SupportedLanguage>) {
      state.language = action.payload;
    },
    serverEnabledChanged(state, action: PayloadAction<boolean>) {
      state.serverEnabled = action.payload;
    },
    serverPortChanged(state, action: PayloadAction<number>) {
      state.serverPort = Math.max(1, Math.min(65535, Math.floor(action.payload)));
    },
    serveOnLocalNetworkChanged(state, action: PayloadAction<boolean>) {
      state.serveOnLocalNetwork = action.payload;
    },
    runtimeAutoUpdateChanged(state, action: PayloadAction<boolean>) {
      state.runtimeAutoUpdate = action.payload;
    },
    remoteEnabledChanged(state, action: PayloadAction<boolean>) {
      state.remoteEnabled = action.payload;
    },
    requireAuthChanged(state, action: PayloadAction<boolean>) {
      state.requireAuth = action.payload;
    },
    allowPerRequestMcpsChanged(state, action: PayloadAction<boolean>) {
      state.allowPerRequestMcps = action.payload;
    },
    allowMcpJsonServersChanged(state, action: PayloadAction<boolean>) {
      state.allowMcpJsonServers = action.payload;
    },
    enableCorsChanged(state, action: PayloadAction<boolean>) {
      state.enableCors = action.payload;
    },
    jitModelLoadingChanged(state, action: PayloadAction<boolean>) {
      state.jitModelLoading = action.payload;
    },
    autoUnloadJitChanged(state, action: PayloadAction<boolean>) {
      state.autoUnloadJit = action.payload;
    },
    maxIdleTtlMinutesChanged(state, action: PayloadAction<number>) {
      state.maxIdleTtlMinutes = Math.max(1, Math.floor(action.payload));
    },
    onlyKeepLastJitModelChanged(state, action: PayloadAction<boolean>) {
      state.onlyKeepLastJitModel = action.payload;
    },

    // General panel
    updateChannelChanged(state, action: PayloadAction<UpdateChannel>) {
      state.updateChannel = action.payload;
      // Switching channels invalidates the prior check result.
      state.updateState = 'idle';
    },
    updateCheckStarted(state) {
      state.updateState = 'checking';
    },
    // Resolves a pending check. `available` is decided by the caller (a
    // thunk-free timer in the panel) — keeps the reducer pure.
    updateCheckResolved(state, action: PayloadAction<boolean>) {
      state.updateState = action.payload ? 'available' : 'up-to-date';
    },
    modelsDirectoryChanged(state, action: PayloadAction<string>) {
      state.modelsDirectory = action.payload;
    },
    modelsDirectoryReset(state) {
      state.modelsDirectory = initialSettingsState.modelsDirectory;
    },
    openDownloadsPaneOnDownloadChanged(state, action: PayloadAction<boolean>) {
      state.openDownloadsPaneOnDownload = action.payload;
    },
    alwaysOpenFullModelLoaderChanged(state, action: PayloadAction<boolean>) {
      state.alwaysOpenFullModelLoader = action.payload;
    },
    alwaysShowFullModelFileNameChanged(state, action: PayloadAction<boolean>) {
      state.alwaysShowFullModelFileName = action.payload;
    },
    useHuggingFaceProxyChanged(state, action: PayloadAction<boolean>) {
      state.useHuggingFaceProxy = action.payload;
    },
    presetConfirmationChanged(state, action: PayloadAction<boolean>) {
      state.presetConfirmation = action.payload;
    },

    // Appearance panel
    navBarPositionChanged(state, action: PayloadAction<NavBarPosition>) {
      state.navBarPosition = action.payload;
    },
    chatViewModeChanged(state, action: PayloadAction<ChatViewMode>) {
      state.chatViewMode = action.payload;
    },
    showTabStripScrollbarChanged(state, action: PayloadAction<boolean>) {
      state.showTabStripScrollbar = action.payload;
    },
    chatFontSizeChanged(state, action: PayloadAction<number>) {
      state.chatFontSize = Math.max(0, Math.min(100, action.payload));
    },
    chatFontWeightChanged(state, action: PayloadAction<ChatFontWeight>) {
      state.chatFontWeight = action.payload;
    },
    showGenInfoChanged(state, action: PayloadAction<ShowGenInfo>) {
      state.showGenInfo = action.payload;
    },
    scrollMessageToTopOnSendChanged(state, action: PayloadAction<boolean>) {
      state.scrollMessageToTopOnSend = action.payload;
    },
    autoLatchOntoGeneratingMessageChanged(state, action: PayloadAction<boolean>) {
      state.autoLatchOntoGeneratingMessage = action.payload;
    },
    chatMessagesStyleChanged(state, action: PayloadAction<ChatMessagesStyle>) {
      state.chatMessagesStyle = action.payload;
    },
    expandChatContainerToWindowWidthChanged(state, action: PayloadAction<boolean>) {
      state.expandChatContainerToWindowWidth = action.payload;
    },
    expandReasoningBlocksByDefaultChanged(state, action: PayloadAction<boolean>) {
      state.expandReasoningBlocksByDefault = action.payload;
    },
    showReasoningBlockVignetteChanged(state, action: PayloadAction<boolean>) {
      state.showReasoningBlockVignette = action.payload;
    },
    onboardingHintRemoved(state, action: PayloadAction<string>) {
      state.onboardingHints = state.onboardingHints.filter((h) => h !== action.payload);
    },
    onboardingHintsReset(state) {
      state.onboardingHints = [...initialSettingsState.onboardingHints];
    },

    // Developer panel
    developerModeEnabledChanged(state, action: PayloadAction<boolean>) {
      state.developerModeEnabled = action.payload;
    },
    enableLocalLlmServiceChanged(state, action: PayloadAction<boolean>) {
      state.enableLocalLlmService = action.payload;
    },
    runtimeDownloadChannelChanged(state, action: PayloadAction<RuntimeDownloadChannel>) {
      state.runtimeDownloadChannel = action.payload;
    },
    autoDeleteLruRuntimePacksChanged(state, action: PayloadAction<boolean>) {
      state.autoDeleteLruRuntimePacks = action.payload;
    },
    showDebugInfoBlocksChanged(state, action: PayloadAction<boolean>) {
      state.showDebugInfoBlocks = action.payload;
    },
    showResourceConsumptionWidgetChanged(state, action: PayloadAction<boolean>) {
      state.showResourceConsumptionWidget = action.payload;
    },
    enableModelLoadConfigInPresetsChanged(state, action: PayloadAction<boolean>) {
      state.enableModelLoadConfigInPresets = action.payload;
    },
    separateReasoningContentChanged(state, action: PayloadAction<boolean>) {
      state.separateReasoningContent = action.payload;
    },

    // Chat panel
    allowOnlyOneNewEmptyChatChanged(state, action: PayloadAction<boolean>) {
      state.allowOnlyOneNewEmptyChat = action.payload;
    },
    unloadCurrentModelOnSelectChanged(state, action: PayloadAction<boolean>) {
      state.unloadCurrentModelOnSelect = action.payload;
    },
    moveDeletedChatsToTrashChanged(state, action: PayloadAction<boolean>) {
      state.moveDeletedChatsToTrash = action.payload;
    },
    doubleClickToEditMessageChanged(state, action: PayloadAction<boolean>) {
      state.doubleClickToEditMessage = action.payload;
    },
    showTokenCountInChatListingsChanged(state, action: PayloadAction<boolean>) {
      state.showTokenCountInChatListings = action.payload;
    },
    alwaysShowPromptTemplateInSidebarChanged(state, action: PayloadAction<boolean>) {
      state.alwaysShowPromptTemplateInSidebar = action.payload;
    },
    doubleClickChatFolderRenamesChanged(state, action: PayloadAction<boolean>) {
      state.doubleClickChatFolderRenames = action.payload;
    },
    sidebarSortChanged(state, action: PayloadAction<SidebarSort>) {
      state.sidebarSort = action.payload;
    },
    sidebarSortOrderChanged(state, action: PayloadAction<SidebarSortOrder>) {
      state.sidebarSortOrder = action.payload;
    },
    shiftEnterToSendChanged(state, action: PayloadAction<boolean>) {
      state.shiftEnterToSend = action.payload;
    },
    cmdRToRegenerateChanged(state, action: PayloadAction<boolean>) {
      state.cmdRToRegenerate = action.payload;
    },
    aiGeneratedChatNamesChanged(state, action: PayloadAction<AiGeneratedChatNames>) {
      state.aiGeneratedChatNames = action.payload;
    },

    // Model defaults panel
    neverExceedImagePxChanged(state, action: PayloadAction<boolean>) {
      state.neverExceedImagePx = action.payload;
    },
    maxImagePxChanged(state, action: PayloadAction<number>) {
      state.maxImagePx = Math.max(64, action.payload);
    },
    defaultContextLengthChanged(state, action: PayloadAction<DefaultContextLength>) {
      state.defaultContextLength = action.payload;
    },
    customContextLengthChanged(state, action: PayloadAction<number>) {
      state.customContextLength = Math.max(512, action.payload);
    },
    modelLoadingGuardrailsChanged(state, action: PayloadAction<ModelLoadingGuardrails>) {
      state.modelLoadingGuardrails = action.payload;
    },
    bypassMemoryLoadWarningsChanged(state, action: PayloadAction<BypassMemoryLoadWarnings>) {
      state.bypassMemoryLoadWarnings = action.payload;
    },

    // LM Link panel
    allowLoadingModelsOnThisMachineChanged(state, action: PayloadAction<boolean>) {
      state.allowLoadingModelsOnThisMachine = action.payload;
    },
    deviceNameChanged(state, action: PayloadAction<string>) {
      state.deviceName = action.payload;
    },

    // Runtime panel
    ggufRuntimeChanged(state, action: PayloadAction<string>) {
      state.ggufRuntimeId = action.payload;
    },
    mlxRuntimeChanged(state, action: PayloadAction<string>) {
      state.mlxRuntimeId = action.payload;
    },
    engineCompatFilterChanged(state, action: PayloadAction<EngineCompatFilter>) {
      state.engineCompatFilter = action.payload;
    },
    engineKindFilterChanged(state, action: PayloadAction<EngineKindFilter>) {
      state.engineKindFilter = action.payload;
    },
    engineUpdated(state, action: PayloadAction<string>) {
      const prev = state.engineStates[action.payload];
      state.engineStates[action.payload] = {
        removed: prev?.removed ?? false,
        updatedToLatest: true,
      };
    },
    engineRemoved(state, action: PayloadAction<string>) {
      const prev = state.engineStates[action.payload];
      state.engineStates[action.payload] = {
        removed: true,
        updatedToLatest: prev?.updatedToLatest ?? false,
      };
    },
    // Clears all per-engine overrides: un-removes a removed engine and
    // reverts an updated one back to its pristine installed version.
    engineRestored(state, action: PayloadAction<string>) {
      delete state.engineStates[action.payload];
    },
    runtimeUpdateCheckStarted(state) {
      state.runtimeUpdateState = 'checking';
    },
    runtimeUpdateCheckResolved(state, action: PayloadAction<boolean>) {
      state.runtimeUpdateState = action.payload ? 'available' : 'up-to-date';
    },

    // Hardware panel
    gpuEnabledChanged(state, action: PayloadAction<boolean>) {
      state.gpuEnabled = action.payload;
    },
    gpuReset(state) {
      state.gpuEnabled = initialSettingsState.gpuEnabled;
    },

    // Integrations panel
    toolAllowed(state, action: PayloadAction<string>) {
      if (!state.allowedToolIds.includes(action.payload)) {
        state.allowedToolIds = [...state.allowedToolIds, action.payload];
      }
    },
    toolDisallowed(state, action: PayloadAction<string>) {
      state.allowedToolIds = state.allowedToolIds.filter((id) => id !== action.payload);
    },
  },
});

export const {
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
  developerModeEnabledChanged,
  enableLocalLlmServiceChanged,
  runtimeDownloadChannelChanged,
  autoDeleteLruRuntimePacksChanged,
  showDebugInfoBlocksChanged,
  showResourceConsumptionWidgetChanged,
  enableModelLoadConfigInPresetsChanged,
  separateReasoningContentChanged,
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
  neverExceedImagePxChanged,
  maxImagePxChanged,
  defaultContextLengthChanged,
  customContextLengthChanged,
  modelLoadingGuardrailsChanged,
  bypassMemoryLoadWarningsChanged,
  allowLoadingModelsOnThisMachineChanged,
  deviceNameChanged,
  ggufRuntimeChanged,
  mlxRuntimeChanged,
  engineCompatFilterChanged,
  engineKindFilterChanged,
  engineUpdated,
  engineRemoved,
  engineRestored,
  runtimeUpdateCheckStarted,
  runtimeUpdateCheckResolved,
  gpuEnabledChanged,
  gpuReset,
  toolAllowed,
  toolDisallowed,
} = settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;
