import { LocalStorageChatRepository } from './infrastructure/repositories/LocalStorageChatRepository';
import { HttpChatStreamSimulator } from './infrastructure/simulators/HttpChatStreamSimulator';
import { chatRoutes } from './presentation/routes';
import {
  chatConfigReducer,
  chatConfigSlice,
  type ChatConfigState,
} from './presentation/store/configSlice';
import { chatReducer, chatSlice } from './presentation/store/slice';

import type { ChatRepository } from './domain/ports/ChatRepository';
import type { ChatStreamSimulator } from './domain/ports/ChatStreamSimulator';
import type { ChatState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';

export interface ChatContainer {
  readonly chatRepository: ChatRepository;
  readonly chatStreamSimulator: ChatStreamSimulator;
}

export function wireChatContainer(shared: SharedContainer): ChatContainer {
  return {
    chatRepository: new LocalStorageChatRepository(shared.kvStore),
    chatStreamSimulator: new HttpChatStreamSimulator(),
  };
}

declare module '@shared/container' {
  interface ContainerExtensions {
    readonly chat: ChatContainer;
  }
}

declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly chat: ChatState;
    readonly chatConfig: ChatConfigState;
  }
}

export { chatReducer, chatSlice, chatConfigReducer, chatConfigSlice };
export { chatRoutes };
export {
  selectThreads,
  selectSelectedThreadId,
  selectSelectedThread,
  selectHasAnyThread,
  selectMessagesForThread,
  selectIsStreaming,
  selectIsStreamingForSelected,
  selectIsStreamingForThread,
  selectFolders,
  selectPendingFolderRenameId,
  selectSplitThreadId,
  selectAttachmentsForThread,
  selectNoteForThread,
  selectInferenceConfig,
  selectExpandedPanels,
  selectPresets,
  selectCurrentPresetId,
  selectEnabledIntegrationIds,
  selectAvailableIntegrations,
  selectReasoningEnabled,
  selectModelGate,
} from './presentation/store/selectors';
export {
  createThread,
  selectThread,
  renameThread,
  pinThread,
  moveThreadToFolder,
  duplicateThread,
  deleteThread,
  setSplitThread,
  swapSplit,
  createFolder,
  finishFolderRename,
  renameFolder,
  deleteFolder,
  toggleFolderExpanded,
  setThreadNote,
  addAttachment,
  removeAttachment,
  appendMessage,
  updateMessageContent,
  deleteMessage,
  appendChunk,
  finalizeMessage,
  setMessages,
  markAllStoppedOnHydrate,
} from './presentation/store/slice';
export {
  setConfigField,
  togglePanel,
  applyPreset,
  saveAsPreset,
  deletePreset,
  toggleIntegration,
  installIntegration,
  uninstallIntegration,
  setReasoningEnabled,
} from './presentation/store/configSlice';
export {
  sendMessageThunk,
  createThreadThunk,
  hydrateThread,
  regenerateThunk,
  continueThunk,
  branchFromMessageThunk,
  editAndResendThunk,
  abortStream,
  deleteThreadThunk,
  deleteMessageThunk,
  updateMessageThunk,
  openModelPickerThunk,
} from './presentation/store/thunks';
export { ChatInferencePanel } from './presentation/components/InferencePanel';
export type { ChatState, Thread, Message, Attachment, Folder } from './presentation/store/slice';
export type { ChatConfigState, PanelKey } from './presentation/store/configSlice';
export type { InferenceConfig } from './domain/entities/InferenceConfig';
export type { Preset } from './domain/entities/Preset';
export type { FolderId } from './domain/entities/Folder';
export type { ThreadId } from './domain/value-objects/ThreadId';
export type { MessageId } from './domain/value-objects/MessageId';
export type { MessageRole } from './domain/value-objects/MessageRole';
