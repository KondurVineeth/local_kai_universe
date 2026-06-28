import { RepositoryWriteError } from './RepositoryWriteError';

export { RepositoryWriteError };

import type { Message } from '../../domain/entities/Message';
import type { Thread } from '../../domain/entities/Thread';
import type { ChatRepository } from '../../domain/ports/ChatRepository';
import type { ThreadId } from '../../domain/value-objects/ThreadId';
import type { KvStore } from '@shared/persistence/KvStore';

// Storage keys. Threads are stored as a single array (small N). Messages are
// stored per-thread so a long conversation doesn't bloat every thread read.
const THREADS_KEY = 'chat::threads';
const messagesKey = (id: ThreadId) => `chat::messages::${id}`;

function safeSet<T>(kv: KvStore, key: string, value: T): void {
  try {
    kv.set(key, value);
  } catch (err) {
    throw new RepositoryWriteError(
      err instanceof Error ? err.message : 'storage write failed',
      key,
      err,
    );
  }
}

function safeRemove(kv: KvStore, key: string): void {
  try {
    kv.remove(key);
  } catch (err) {
    throw new RepositoryWriteError(
      err instanceof Error ? err.message : 'storage remove failed',
      key,
      err,
    );
  }
}

// localStorage-backed implementation. Reads return Promises even though
// localStorage is synchronous — preserves the async port contract so an
// HttpChatRepository can swap in without changing presentation code.
//
// Writes: every kv.set is funneled through safeSet so a QuotaExceededError
// (or any other localStorage failure) is surfaced as a typed
// RepositoryWriteError. Callers can either let it bubble (the default) or
// catch + dispatch a notification.
//
// `messageCount`: previously this method speculatively wrote
// `messageCount + 1` after every append. Two failure modes:
//   1. Partial failure — kv.set on the messagesKey succeeded but the
//      follow-up saveThread for the count failed (or was skipped because the
//      thread record had been deleted in another window). messages.length
//      and messageCount drifted apart.
//   2. Concurrent appends — two split panes both read messageCount=N, both
//      write N+1; final value is N+1 even though there are now N+2 messages.
// Fix: derive the count from the actual messages-list length AFTER the write
// and only persist if it differs from what's on the thread record. This is a
// last-write-wins read-modify-write, but the read happens AFTER the messages
// write so it always reflects the post-state of the source-of-truth list.
export class LocalStorageChatRepository implements ChatRepository {
  constructor(private readonly kv: KvStore) {}

  async listThreads(): Promise<readonly Thread[]> {
    return this.kv.get<readonly Thread[]>(THREADS_KEY) ?? [];
  }

  async getThread(id: ThreadId): Promise<Thread | null> {
    const all = await this.listThreads();
    return all.find((t) => t.id === id) ?? null;
  }

  async saveThread(thread: Thread): Promise<void> {
    const all = (await this.listThreads()).slice();
    const idx = all.findIndex((t) => t.id === thread.id);
    if (idx === -1) all.unshift(thread);
    else all[idx] = thread;
    safeSet(this.kv, THREADS_KEY, all);
  }

  async deleteThread(id: ThreadId): Promise<void> {
    const all = (await this.listThreads()).filter((t) => t.id !== id);
    safeSet(this.kv, THREADS_KEY, all);
    safeRemove(this.kv, messagesKey(id));
  }

  async listMessages(threadId: ThreadId): Promise<readonly Message[]> {
    return this.kv.get<readonly Message[]>(messagesKey(threadId)) ?? [];
  }

  async appendMessage(threadId: ThreadId, message: Message): Promise<void> {
    const existing = await this.listMessages(threadId);
    const next = [...existing, message];
    safeSet(this.kv, messagesKey(threadId), next);
    // Derive the denormalized messageCount from the actual list length so the
    // thread record stays consistent with the messages array even after a
    // partial-failure history or concurrent appends from a second pane.
    const thread = await this.getThread(threadId);
    if (thread && thread.messageCount !== next.length) {
      await this.saveThread({ ...thread, messageCount: next.length });
    }
  }

  async updateMessage(
    threadId: ThreadId,
    messageId: string,
    content: string,
    streaming: boolean,
  ): Promise<void> {
    const existing = await this.listMessages(threadId);
    const next = existing.map((m) => (m.id === messageId ? { ...m, content, streaming } : m));
    safeSet(this.kv, messagesKey(threadId), next);
  }

  async replaceMessages(threadId: ThreadId, messages: readonly Message[]): Promise<void> {
    safeSet(this.kv, messagesKey(threadId), messages);
  }
}
