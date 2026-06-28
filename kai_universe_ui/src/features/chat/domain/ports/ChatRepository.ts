import type { Message } from '../entities/Message';
import type { Thread } from '../entities/Thread';
import type { ThreadId } from '../value-objects/ThreadId';

// Read/write port for chat state. Phase 1 uses a localStorage-backed
// adapter (LocalStorageChatRepository) so reload survives. A future
// HttpChatRepository would talk to a real backend without changing
// any consumer code.
//
// Reads are async to match the eventual real-backend contract — even
// when the localStorage adapter resolves synchronously, presentation
// code awaits a Promise.
export interface ChatRepository {
  listThreads(): Promise<readonly Thread[]>;
  getThread(id: ThreadId): Promise<Thread | null>;
  saveThread(thread: Thread): Promise<void>;
  deleteThread(id: ThreadId): Promise<void>;

  listMessages(threadId: ThreadId): Promise<readonly Message[]>;
  appendMessage(threadId: ThreadId, message: Message): Promise<void>;
  updateMessage(threadId: ThreadId, messageId: string, content: string, streaming: boolean): Promise<void>;
  // Snapshot the full message list for a thread. Used after stream finalize
  // so the repo reflects all meta fields (modelName, metrics, reasoningTrace)
  // — the per-chunk `updateMessage` only carries content + streaming flag.
  replaceMessages(threadId: ThreadId, messages: readonly Message[]): Promise<void>;
}
