import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { newId } from '@shared/lib/newId';

import type { Attachment } from '../../domain/entities/Attachment';
import type { Folder, FolderColor, FolderId } from '../../domain/entities/Folder';
import type { Message } from '../../domain/entities/Message';
import type { Thread } from '../../domain/entities/Thread';
import type { MessageId } from '../../domain/value-objects/MessageId';
import type { ThreadId } from '../../domain/value-objects/ThreadId';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

// Re-exported through the feature barrel for cross-feature consumers; the
// domain types are the source of truth.
export type { Attachment, Folder, Message, Thread };

export interface ChatState {
  readonly threads: readonly Thread[];
  readonly selectedThreadId: ThreadId | null;
  // Messages keyed by threadId. A flat record beats normalizr for this scale.
  readonly messagesByThread: Readonly<Record<ThreadId, readonly Message[]>>;
  readonly folders: readonly Folder[];
  readonly notesByThread: Readonly<Record<ThreadId, string>>;
  // ISO-8601 last-edited timestamps per thread, set on every setThreadNote
  // dispatch (and cleared when the note is wiped). Surfaced in the right-
  // rail Notes panel as a "Saved · 2 min ago" line so the user has visible
  // confirmation the auto-save took effect.
  readonly notesUpdatedByThread: Readonly<Record<ThreadId, Iso8601>>;
  readonly attachmentsByThread: Readonly<Record<ThreadId, readonly Attachment[]>>;
  // Per-thread compose drafts. Keyed by threadId so switching threads
  // preserves the in-progress message; cleared on send. Lives in the slice
  // (whitelisted via the `chat` key) so drafts also survive reloads.
  readonly draftsByThread: Readonly<Record<ThreadId, string>>;
  readonly splitThreadId: ThreadId | null;
  // When a folder is freshly created, its row should auto-enter rename mode
  // so the user can type a real name immediately. The slice writes the id
  // here; FolderRow watches it and self-clears via finishFolderRename.
  readonly pendingFolderRenameId: FolderId | null;
  // Per-message override for the ReasoningBlock disclosure. Only present
  // when the user has explicitly toggled — absence means "follow auto-rule"
  // (open while streaming reasoning, collapse once body starts). Persisted
  // alongside the rest of chat so the toggle survives a remount/reload.
  // BUG-CHAT-RENDER-006.
  readonly reasoningOpenOverrides: Readonly<Record<MessageId, boolean>>;
  // Per-thread override for the dock's reasoning-trace pill. Absence means
  // "follow the global default" (chatConfig.reasoningEnabled). Once the
  // user toggles the pill on a specific thread, the override sticks for
  // that thread only — switching to another thread shows whatever that
  // thread last had (or the global default if untouched).
  readonly reasoningOverridesByThread: Readonly<Record<ThreadId, boolean>>;
  // Multi-selection state for the sidebar. Empty most of the time — shift-
  // clicking a row toggles its membership; the bulk-action bar surfaces
  // when at least one id is selected. Stored as a record (set-shape) so
  // membership lookups stay O(1) and Immer can produce a new reference
  // cheaply.
  readonly multiSelectedThreadIds: Readonly<Record<ThreadId, true>>;
}

const initialState: ChatState = {
  threads: [],
  selectedThreadId: null,
  messagesByThread: {},
  folders: [],
  notesByThread: {},
  notesUpdatedByThread: {},
  attachmentsByThread: {},
  draftsByThread: {},
  splitThreadId: null,
  pendingFolderRenameId: null,
  reasoningOpenOverrides: {},
  reasoningOverridesByThread: {},
  multiSelectedThreadIds: {},
};

function newThreadId(): ThreadId {
  return newId('t') as ThreadId;
}

function newFolderId(): FolderId {
  return newId('f') as FolderId;
}

function newMessageId(): MessageId {
  return newId('m') as MessageId;
}

const FOLDER_NAME_MAX = 100;

function sanitizeFolderName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'New Folder';
  return trimmed.length > FOLDER_NAME_MAX ? trimmed.slice(0, FOLDER_NAME_MAX) : trimmed;
}

function replaceThread(threads: readonly Thread[], id: ThreadId, patch: Partial<Thread>): Thread[] {
  const idx = threads.findIndex((t) => t.id === id);
  if (idx === -1) return [...threads];
  const t = threads[idx];
  if (!t) return [...threads];
  return [...threads.slice(0, idx), { ...t, ...patch }, ...threads.slice(idx + 1)];
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createThread(state, action: PayloadAction<{ folderId?: FolderId | null } | undefined>) {
      // Global dedupe: at most ONE empty (no-message) thread exists in the
      // whole app, full stop. Per-folder dedupe was the previous rule but
      // produced duplicate "New Chat" rows whenever a user clicked New in
      // different folders. Now any empty thread is surfaced regardless of
      // which folder context the caller asked for, and the surfaced thread
      // is RE-PARENTED to the requested folder so the user's mental folder
      // context is honored. Renamed-but-still-empty threads dedupe too;
      // the rule is "messageCount === 0 && !pinned".
      const folderId = action.payload?.folderId ?? null;
      const existingEmpty = state.threads.find(
        (t) => t.messageCount === 0 && !t.pinned,
      );
      if (existingEmpty) {
        if ((existingEmpty.folderId ?? null) !== folderId) {
          state.threads = replaceThread(state.threads, existingEmpty.id, { folderId });
        }
        state.selectedThreadId = existingEmpty.id;
        if (folderId) {
          state.folders = state.folders.map((f) =>
            f.id === folderId ? { ...f, expanded: true } : f,
          );
        }
        return;
      }
      const id = newThreadId();
      const thread: Thread = {
        id,
        title: 'New Chat',
        createdAt: new Date().toISOString() as Thread['createdAt'],
        messageCount: 0,
        folderId,
      };
      state.threads = [thread, ...state.threads];
      state.selectedThreadId = id;
      // Make sure the destination folder is visible — otherwise the new
      // thread is hidden inside a collapsed folder body.
      if (folderId) {
        state.folders = state.folders.map((f) =>
          f.id === folderId ? { ...f, expanded: true } : f,
        );
      }
    },
    selectThread(state, action: PayloadAction<ThreadId | null>) {
      state.selectedThreadId = action.payload;
    },
    renameThread(state, action: PayloadAction<{ id: ThreadId; title: string }>) {
      state.threads = replaceThread(state.threads, action.payload.id, {
        title: action.payload.title,
      });
    },
    pinThread(state, action: PayloadAction<{ id: ThreadId; pinned: boolean }>) {
      // Pin and folder are mutually exclusive — pinning lifts the chat out of
      // its folder. Unpinning leaves it Unfiled (we don't try to remember the
      // previous folder; the user can drag it back if they want).
      const patch = action.payload.pinned
        ? { pinned: true, folderId: null }
        : { pinned: false };
      state.threads = replaceThread(state.threads, action.payload.id, patch);
    },
    moveThreadToFolder(
      state,
      action: PayloadAction<{ id: ThreadId; folderId: FolderId | null }>,
    ) {
      // A thread can be Pinned XOR InFolder. Moving into a folder un-pins.
      // Moving to Unfiled preserves pin (user stays able to pin un-foldered).
      const patch = action.payload.folderId
        ? { folderId: action.payload.folderId, pinned: false }
        : { folderId: null };
      state.threads = replaceThread(state.threads, action.payload.id, patch);
      // Auto-expand destination folder so the moved chat is visible. Without
      // this, dropping a chat onto a collapsed folder makes it look deleted.
      if (action.payload.folderId) {
        state.folders = state.folders.map((f) =>
          f.id === action.payload.folderId ? { ...f, expanded: true } : f,
        );
      }
    },
    duplicateThread(state, action: PayloadAction<ThreadId>) {
      const src = state.threads.find((t) => t.id === action.payload);
      if (!src) return;
      const id = newThreadId();
      // Duplicates start un-pinned. The user can re-pin if they want; the
      // alternative — two pinned chats with identical titles — is noisier.
      const copy: Thread = {
        ...src,
        id,
        title: `${src.title} (copy)`,
        createdAt: new Date().toISOString() as Thread['createdAt'],
        pinned: false,
      };
      state.threads = [copy, ...state.threads];
      // Deep-copy each message with a fresh id + the new threadId. Sharing
      // ids with the source would make edit/delete on the copy mutate the
      // original (and vice versa).
      const srcMsgs = state.messagesByThread[src.id] ?? [];
      // Strip the `streaming` flag on clone. If the source thread is mid-
      // stream, the in-flight controller is keyed to the source id only —
      // the duplicate would render a phantom streaming bubble with no
      // controller and no way to land chunks. Treat clones as finalized.
      const clonedMsgs: Message[] = srcMsgs.map((m) => ({
        ...m,
        id: newMessageId(),
        threadId: id,
        streaming: false,
      }));
      state.messagesByThread = { ...state.messagesByThread, [id]: clonedMsgs };
      // Carry over the per-thread notes and attachments so the copy is a
      // true working duplicate, not a stripped shell.
      const srcNote = state.notesByThread[src.id];
      if (srcNote) state.notesByThread = { ...state.notesByThread, [id]: srcNote };
      const srcAttachments = state.attachmentsByThread[src.id];
      if (srcAttachments && srcAttachments.length > 0) {
        state.attachmentsByThread = {
          ...state.attachmentsByThread,
          [id]: srcAttachments.map((a) => ({ ...a })),
        };
      }
    },
    deleteThread(state, action: PayloadAction<ThreadId>) {
      state.threads = state.threads.filter((t) => t.id !== action.payload);
      if (state.selectedThreadId === action.payload) state.selectedThreadId = null;
      // Clear split-pane reference too — otherwise the right pane mounts
      // against a deleted threadId and selectors return empty arrays for it.
      if (state.splitThreadId === action.payload) state.splitThreadId = null;
      const next = { ...state.messagesByThread };
      delete next[action.payload];
      state.messagesByThread = next;
      // Drop side-channel data tied to this thread so persisted state doesn't
      // grow indefinitely with orphaned notes/attachments after delete.
      const nextNotes = { ...state.notesByThread };
      delete nextNotes[action.payload];
      state.notesByThread = nextNotes;
      const nextNotesUpdated = { ...state.notesUpdatedByThread };
      delete nextNotesUpdated[action.payload];
      state.notesUpdatedByThread = nextNotesUpdated;
      const nextAttachments = { ...state.attachmentsByThread };
      delete nextAttachments[action.payload];
      state.attachmentsByThread = nextAttachments;
      // Drop the in-progress compose draft for the deleted thread so persisted
      // state doesn't accumulate orphaned drafts.
      const nextDrafts = { ...state.draftsByThread };
      delete nextDrafts[action.payload];
      state.draftsByThread = nextDrafts;
      // Drop the per-thread reasoning override too.
      if (state.reasoningOverridesByThread[action.payload] !== undefined) {
        const nextRO = { ...state.reasoningOverridesByThread };
        delete nextRO[action.payload];
        state.reasoningOverridesByThread = nextRO;
      }
      // Drop multi-select membership if the deleted thread was selected.
      if (state.multiSelectedThreadIds[action.payload]) {
        const nextSel = { ...state.multiSelectedThreadIds };
        delete nextSel[action.payload];
        state.multiSelectedThreadIds = nextSel;
      }
    },
    // Toggle membership of a thread in the multi-select set. Shift-clicking
    // a row flips it. Empty record == no multi-selection (the bulk-action
    // bar hides). Also drops the id when the thread itself is deleted, see
    // `deleteThread` above.
    toggleMultiSelectThread(state, action: PayloadAction<ThreadId>) {
      const next = { ...state.multiSelectedThreadIds };
      if (next[action.payload]) delete next[action.payload];
      else next[action.payload] = true;
      state.multiSelectedThreadIds = next;
    },
    clearMultiSelect(state) {
      if (Object.keys(state.multiSelectedThreadIds).length === 0) return;
      state.multiSelectedThreadIds = {};
    },
    setSplitThread(state, action: PayloadAction<ThreadId | null>) {
      const next = action.payload;
      // Reject "same on both sides" — comparing a thread to itself is a UX
      // dead-end (mirrored panes, no signal). Treat the request as a close.
      if (next !== null && next === state.selectedThreadId) {
        state.splitThreadId = null;
        return;
      }
      // Reject stale ids — UI may hold a reference to a thread that's been
      // deleted between render and click. Defensive: fail closed to null.
      if (next !== null && !state.threads.some((t) => t.id === next)) {
        state.splitThreadId = null;
        return;
      }
      state.splitThreadId = next;
    },
    // Exchange main and split. Used by SplitPane's swap-with-main button so
    // the user can promote the compared thread to the focused position.
    swapSplit(state) {
      const main = state.selectedThreadId;
      const split = state.splitThreadId;
      if (!main || !split) return;
      state.selectedThreadId = split;
      state.splitThreadId = main;
    },
    // Used by branchFromMessageThunk to atomically add the new branch thread
    // and seed its messages, then select it. Standalone action so the thunk
    // doesn't have to dispatch three separate updates.
    //
    // Optional `note` / `attachments` carry over the source thread's
    // side-channel data so the branch is a true working copy (mirrors
    // duplicateThread behaviour). Both default to "no value" so callers that
    // only forward messages still work.
    injectBranch(
      state,
      action: PayloadAction<{
        thread: Thread;
        messages: readonly Message[];
        note?: string;
        attachments?: readonly Attachment[];
      }>,
    ) {
      const { thread, messages, note, attachments } = action.payload;
      state.threads = [thread, ...state.threads];
      state.selectedThreadId = thread.id;
      state.messagesByThread = {
        ...state.messagesByThread,
        [thread.id]: messages,
      };
      if (note && note.length > 0) {
        state.notesByThread = { ...state.notesByThread, [thread.id]: note };
      }
      if (attachments && attachments.length > 0) {
        state.attachmentsByThread = {
          ...state.attachmentsByThread,
          [thread.id]: attachments.map((a) => ({ ...a })),
        };
      }
    },

    // ── folders ─────────────────────────────────────────────────────────────
    createFolder(state, action: PayloadAction<string>) {
      // Dedupe: if there's already an empty (no chats) folder still in
      // pending-rename mode, surface that one instead of stacking duplicates.
      // Matches the createThread pattern.
      if (state.pendingFolderRenameId) {
        const stillEmpty = state.folders.some(
          (f) =>
            f.id === state.pendingFolderRenameId &&
            !state.threads.some((t) => t.folderId === f.id),
        );
        if (stillEmpty) return;
      }
      const folder: Folder = {
        id: newFolderId(),
        name: sanitizeFolderName(action.payload),
        expanded: true,
      };
      // Prepend so the newly-created folder is always in the visible viewport
      // — append-at-end was hiding it for users with many folders.
      state.folders = [folder, ...state.folders];
      // Mark for auto-rename so the row mounts directly into edit mode.
      state.pendingFolderRenameId = folder.id;
    },
    finishFolderRename(state) {
      state.pendingFolderRenameId = null;
    },
    renameFolder(state, action: PayloadAction<{ id: FolderId; name: string }>) {
      // Defense in depth: trim + length-cap + empty-fallback at the reducer
      // boundary, not just in the rename UI. Keeps the invariant intact for
      // any future caller (devtools, time-travel, alt UI).
      const target = state.folders.find((f) => f.id === action.payload.id);
      if (!target) return;
      const next = sanitizeFolderName(action.payload.name);
      const safe = next === 'New Folder' && action.payload.name.trim() === '' ? target.name : next;
      state.folders = state.folders.map((f) =>
        f.id === action.payload.id ? { ...f, name: safe } : f,
      );
    },
    deleteFolder(state, action: PayloadAction<FolderId>) {
      const folderId = action.payload;
      state.folders = state.folders.filter((f) => f.id !== folderId);
      // Cascade-delete: chats inside the folder are destroyed along with
      // the folder. Matches ZL Universe's "real folder" model — confirm copy
      // in FolderRow makes the destruction explicit.
      const doomedIds = new Set(
        state.threads.filter((t) => t.folderId === folderId).map((t) => t.id),
      );
      if (doomedIds.size > 0) {
        state.threads = state.threads.filter((t) => !doomedIds.has(t.id));
        if (state.selectedThreadId && doomedIds.has(state.selectedThreadId)) {
          state.selectedThreadId = null;
        }
        if (state.splitThreadId && doomedIds.has(state.splitThreadId)) {
          state.splitThreadId = null;
        }
        // Drop side-channel data tied to the doomed threads — leaving these
        // behind would balloon persisted state with unreachable entries.
        const nextMessages = { ...state.messagesByThread };
        const nextNotes = { ...state.notesByThread };
        const nextAttachments = { ...state.attachmentsByThread };
        const nextDrafts = { ...state.draftsByThread };
        for (const id of doomedIds) {
          delete nextMessages[id];
          delete nextNotes[id];
          delete nextAttachments[id];
          delete nextDrafts[id];
        }
        state.messagesByThread = nextMessages;
        state.notesByThread = nextNotes;
        state.attachmentsByThread = nextAttachments;
        state.draftsByThread = nextDrafts;
      }
      // Clear the pending-rename pointer if it was targeting the gone folder
      // — otherwise the persisted state retains a dangling id forever.
      if (state.pendingFolderRenameId === folderId) {
        state.pendingFolderRenameId = null;
      }
    },
    toggleFolderExpanded(state, action: PayloadAction<FolderId>) {
      state.folders = state.folders.map((f) =>
        f.id === action.payload ? { ...f, expanded: !f.expanded } : f,
      );
    },
    // Sets the optional accent color tag on a folder. Pass `null` to clear.
    // The picker UI offers a curated palette (blue/green/purple/orange/
    // red/pink) — keep this enum-aligned with FolderColor.
    setFolderColor(
      state,
      action: PayloadAction<{ id: FolderId; color: FolderColor | null }>,
    ) {
      state.folders = state.folders.map((f) =>
        f.id === action.payload.id ? { ...f, color: action.payload.color } : f,
      );
    },

    // ── notes / attachments ─────────────────────────────────────────────────
    setThreadNote(state, action: PayloadAction<{ threadId: ThreadId; note: string }>) {
      state.notesByThread = {
        ...state.notesByThread,
        [action.payload.threadId]: action.payload.note,
      };
      // Stamp the per-thread "updated" timestamp so the panel can render
      // "Saved · 2 min ago". When the note is cleared, drop the timestamp
      // too — an empty note has no edit history to show.
      const trimmed = action.payload.note.trim();
      if (trimmed.length === 0) {
        if (state.notesUpdatedByThread[action.payload.threadId] !== undefined) {
          const next = { ...state.notesUpdatedByThread };
          delete next[action.payload.threadId];
          state.notesUpdatedByThread = next;
        }
        return;
      }
      state.notesUpdatedByThread = {
        ...state.notesUpdatedByThread,
        [action.payload.threadId]: new Date().toISOString() as Iso8601,
      };
    },
    addAttachment(
      state,
      action: PayloadAction<{ threadId: ThreadId; attachment: Attachment }>,
    ) {
      const list = state.attachmentsByThread[action.payload.threadId] ?? [];
      // Dedupe by name + sizeBytes + kind so the same picker click (or a
      // duplicate paste/drop) doesn't stack identical chips. Different `id`s
      // would otherwise look like distinct attachments and double the upload.
      const incoming = action.payload.attachment;
      const isDuplicate = list.some(
        (a) =>
          a.name === incoming.name &&
          a.kind === incoming.kind &&
          (a.sizeBytes ?? null) === (incoming.sizeBytes ?? null),
      );
      if (isDuplicate) return;
      state.attachmentsByThread = {
        ...state.attachmentsByThread,
        [action.payload.threadId]: [...list, incoming],
      };
    },
    removeAttachment(state, action: PayloadAction<{ threadId: ThreadId; attachmentId: string }>) {
      const list = state.attachmentsByThread[action.payload.threadId] ?? [];
      state.attachmentsByThread = {
        ...state.attachmentsByThread,
        [action.payload.threadId]: list.filter((a) => a.id !== action.payload.attachmentId),
      };
    },
    // Drop every attachment for a thread. Called from the input dock after a
    // successful send so attachments don't leak across messages
    // (BUG-CHAT-COMPOSE-004).
    clearAttachments(state, action: PayloadAction<ThreadId>) {
      if (!state.attachmentsByThread[action.payload]) return;
      const next = { ...state.attachmentsByThread };
      delete next[action.payload];
      state.attachmentsByThread = next;
    },
    // Per-thread compose draft. The dock reads/writes through these so the
    // value survives unmount + thread switches (BUG-CHAT-COMPOSE-006).
    setDraft(state, action: PayloadAction<{ threadId: ThreadId; draft: string }>) {
      state.draftsByThread = {
        ...state.draftsByThread,
        [action.payload.threadId]: action.payload.draft,
      };
    },
    clearDraft(state, action: PayloadAction<ThreadId>) {
      if (!state.draftsByThread[action.payload]) return;
      const next = { ...state.draftsByThread };
      delete next[action.payload];
      state.draftsByThread = next;
    },

    // ── messages ────────────────────────────────────────────────────────────
    appendMessage(state, action: PayloadAction<{ threadId: ThreadId; message: Message }>) {
      const { threadId, message } = action.payload;
      const existing = state.messagesByThread[threadId] ?? [];
      state.messagesByThread = {
        ...state.messagesByThread,
        [threadId]: [...existing, message],
      };
      const idx = state.threads.findIndex((t) => t.id === threadId);
      if (idx !== -1) {
        const t = state.threads[idx];
        if (t) {
          state.threads = [
            ...state.threads.slice(0, idx),
            { ...t, messageCount: t.messageCount + 1 },
            ...state.threads.slice(idx + 1),
          ];
        }
      }
    },
    updateMessageContent(
      state,
      action: PayloadAction<{
        threadId: ThreadId;
        messageId: MessageId;
        content: string;
        // When true, stamp the message as `edited` so an in-place edit
        // (no resend) shows an "edited" badge instead of silently
        // rewriting history.
        edited?: boolean;
      }>,
    ) {
      const { threadId, messageId, content, edited } = action.payload;
      const list = state.messagesByThread[threadId] ?? [];
      state.messagesByThread = {
        ...state.messagesByThread,
        [threadId]: list.map((m) =>
          m.id === messageId
            ? { ...m, content, ...(edited ? { edited: true } : {}) }
            : m,
        ),
      };
    },
    deleteMessage(state, action: PayloadAction<{ threadId: ThreadId; messageId: MessageId }>) {
      const { threadId, messageId } = action.payload;
      const list = state.messagesByThread[threadId] ?? [];
      const next = list.filter((m) => m.id !== messageId);
      state.messagesByThread = { ...state.messagesByThread, [threadId]: next };
      const idx = state.threads.findIndex((t) => t.id === threadId);
      if (idx !== -1) {
        const t = state.threads[idx];
        if (t) {
          state.threads = [
            ...state.threads.slice(0, idx),
            { ...t, messageCount: Math.max(0, t.messageCount - 1) },
            ...state.threads.slice(idx + 1),
          ];
        }
      }
      // Drop the deleted message's reasoning-open override so the persisted
      // record doesn't accumulate dangling MessageId keys forever.
      if (state.reasoningOpenOverrides[messageId] !== undefined) {
        const { [messageId]: _drop, ...rest } = state.reasoningOpenOverrides;
        void _drop;
        state.reasoningOpenOverrides = rest;
      }
    },
    appendChunk(
      state,
      action: PayloadAction<{
        threadId: ThreadId;
        messageId: MessageId;
        delta: string;
        kind?: 'body' | 'reasoning';
      }>,
    ) {
      const { threadId, messageId, delta, kind = 'body' } = action.payload;
      const list = state.messagesByThread[threadId] ?? [];
      // BUG-CHAT-FEED-011: warn (in dev) when a chunk lands on a message that
      // no longer exists — silent no-op was hiding stream/registry bugs.
      if (list.findIndex((m) => m.id === messageId) === -1) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(
            '[chat] appendChunk: message %s not found in thread %s',
            messageId,
            threadId,
          );
        }
        return;
      }
      state.messagesByThread = {
        ...state.messagesByThread,
        [threadId]: list.map((m) => {
          if (m.id !== messageId) return m;
          if (kind === 'reasoning') {
            return { ...m, reasoningTrace: (m.reasoningTrace ?? '') + delta };
          }
          return { ...m, content: m.content + delta };
        }),
      };
    },
    // BUG-CHAT-FEED-004: dedicated action for "this existing message is now
    // streaming again" used by continueThunk before any chunks arrive.
    // Idempotent — flipping streaming:true on an already-streaming message
    // is a no-op.
    markStreaming(
      state,
      action: PayloadAction<{ threadId: ThreadId; messageId: MessageId }>,
    ) {
      const { threadId, messageId } = action.payload;
      const list = state.messagesByThread[threadId] ?? [];
      state.messagesByThread = {
        ...state.messagesByThread,
        [threadId]: list.map((m) =>
          m.id === messageId ? { ...m, streaming: true } : m,
        ),
      };
    },
    finalizeMessage(
      state,
      action: PayloadAction<{
        threadId: ThreadId;
        messageId: MessageId;
        modelName?: string;
        tokenCount?: number;
        tokensPerSecond?: number;
        elapsedMs?: number;
        stopReason?: string;
        reasoningElapsedMs?: number;
        visualizedDraft?: boolean;
      }>,
    ) {
      const { threadId, messageId, ...metrics } = action.payload;
      const list = state.messagesByThread[threadId] ?? [];
      state.messagesByThread = {
        ...state.messagesByThread,
        [threadId]: list.map((m) =>
          m.id === messageId ? { ...m, streaming: false, ...metrics } : m,
        ),
      };
    },
    setMessages(
      state,
      action: PayloadAction<{ threadId: ThreadId; messages: readonly Message[] }>,
    ) {
      state.messagesByThread = {
        ...state.messagesByThread,
        [action.payload.threadId]: action.payload.messages,
      };
    },
    // BUG-CHAT-RENDER-006: persist user's open/collapse choice per message.
    // ReasoningBlock falls back to the auto-rule when no override exists.
    setReasoningOpen(
      state,
      action: PayloadAction<{ messageId: MessageId; open: boolean }>,
    ) {
      // Tolerate rehydrated state that pre-dates this field.
      const current = state.reasoningOpenOverrides ?? {};
      state.reasoningOpenOverrides = {
        ...current,
        [action.payload.messageId]: action.payload.open,
      };
    },
    // Per-thread override for the dock's reasoning pill. Pass `null` to
    // clear the override and fall back to the global default again.
    setThreadReasoningOverride(
      state,
      action: PayloadAction<{ threadId: ThreadId; enabled: boolean | null }>,
    ) {
      const current = state.reasoningOverridesByThread ?? {};
      if (action.payload.enabled === null) {
        if (current[action.payload.threadId] === undefined) return;
        const next = { ...current };
        delete next[action.payload.threadId];
        state.reasoningOverridesByThread = next;
        return;
      }
      state.reasoningOverridesByThread = {
        ...current,
        [action.payload.threadId]: action.payload.enabled,
      };
    },
    // BUG-CHAT-FEED-003: dispatched once on app start. Any persisted message
    // still flagged `streaming:true` is rolled back to a finalized state with
    // `stopReason: 'Interrupted by reload'` so assistant bubbles aren't stuck
    // with a streaming cursor forever after a crash/reload mid-stream.
    markAllStoppedOnHydrate(state) {
      // Spread one entry at a time to keep Immer happy with the readonly type.
      for (const threadId of Object.keys(state.messagesByThread) as ThreadId[]) {
        const msgs = state.messagesByThread[threadId] ?? [];
        let touched = false;
        const cleaned = msgs.map((m) => {
          if (!m.streaming) return m;
          touched = true;
          return {
            ...m,
            streaming: false,
            stopReason: m.stopReason ?? 'Interrupted by reload',
          };
        });
        if (touched) {
          state.messagesByThread = {
            ...state.messagesByThread,
            [threadId]: cleaned,
          };
        }
      }
      // Enforce the global empty-thread dedupe rule against legacy state.
      // Pre-fix, the reducer deduped per-folder, so users can have multiple
      // empty "New Chat" rows scattered across folders. Keep the most-
      // recently-created empty thread and prune the rest; this matches what
      // the new createThread reducer would have produced.
      const emptyThreads = state.threads.filter(
        (t) => t.messageCount === 0 && !t.pinned,
      );
      if (emptyThreads.length > 1) {
        const sorted = [...emptyThreads].sort((a, b) =>
          a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
        );
        const keep = sorted[0];
        if (!keep) return;
        const doomed = new Set(
          sorted.slice(1).map((t) => t.id),
        );
        state.threads = state.threads.filter((t) => !doomed.has(t.id));
        if (state.selectedThreadId && doomed.has(state.selectedThreadId)) {
          state.selectedThreadId = keep.id;
        }
        // Side-channel state attached to doomed threads is empty by
        // definition (no messages → no notes-of-substance is unlikely but
        // possible; we drop empty messages buckets only).
        const nextMessages = { ...state.messagesByThread };
        for (const id of doomed) delete nextMessages[id];
        state.messagesByThread = nextMessages;
      }
    },
  },
});

export function selectReasoningOpenOverride(
  state: { chat: ChatState },
  messageId: MessageId,
): boolean | undefined {
  return state.chat.reasoningOpenOverrides?.[messageId];
}

export const hasEmptyThread = (threads: readonly Thread[]): boolean =>
  threads.some((t) => t.messageCount === 0);

export const {
  createThread,
  selectThread,
  renameThread,
  pinThread,
  moveThreadToFolder,
  duplicateThread,
  deleteThread,
  setSplitThread,
  swapSplit,
  injectBranch,
  createFolder,
  finishFolderRename,
  renameFolder,
  deleteFolder,
  toggleFolderExpanded,
  setFolderColor,
  setThreadNote,
  addAttachment,
  removeAttachment,
  clearAttachments,
  setDraft,
  clearDraft,
  appendMessage,
  updateMessageContent,
  deleteMessage,
  appendChunk,
  finalizeMessage,
  markStreaming,
  setMessages,
  setReasoningOpen,
  setThreadReasoningOverride,
  toggleMultiSelectThread,
  clearMultiSelect,
  markAllStoppedOnHydrate,
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
