import { selectLoadedModelIsReasoning, selectModelLoadStatus } from '@features/shell';

import type { ChatConfigState, PanelKey } from './configSlice';
import type { Attachment } from '../../domain/entities/Attachment';
import type { Folder } from '../../domain/entities/Folder';
import type { InferenceConfig } from '../../domain/entities/InferenceConfig';
import type { Message } from '../../domain/entities/Message';
import type { Preset } from '../../domain/entities/Preset';
import type { Thread } from '../../domain/entities/Thread';
import type { ThreadId } from '../../domain/value-objects/ThreadId';
import type { RootState } from '@shared/store/hooks';

// ── Module-level sentinels ──────────────────────────────────────────────────
//
// Factory selectors that fall back to a fresh `[]` / `''` on each call cause a
// re-render storm: react-redux's default equality is `===`, and `[] !== []`
// even when both arrays are empty. Returning these frozen module-level
// sentinels makes the empty case stable so unaffected components don't
// re-render when an unrelated thread's messages mutate.
//
// `Object.freeze` is mostly a developer-error guard — the readonly types
// already forbid mutation at the TS level, but the freeze ensures any
// rogue runtime mutation throws in dev and doesn't poison the sentinel.
const EMPTY_MESSAGES: readonly Message[] = Object.freeze([]);
const EMPTY_ATTACHMENTS: readonly Attachment[] = Object.freeze([]);
const EMPTY_NOTE = '';

export const selectThreads = (state: RootState): readonly Thread[] => state.chat.threads;

export const selectSelectedThreadId = (state: RootState): ThreadId | null =>
  state.chat.selectedThreadId;

export const selectSelectedThread = (state: RootState): Thread | null => {
  const id = state.chat.selectedThreadId;
  if (!id) return null;
  return state.chat.threads.find((t) => t.id === id) ?? null;
};

// "Active folder" = the folder containing the currently-selected thread, if
// any. Used to seed createThread's folder context so a "+ New chat" click
// from inside a folder creates the chat in that same folder.
//
// BUG-CHAT-CORE-014: validate that the thread's folderId still resolves to a
// live folder. Without this guard, a freshly-deleted folder leaves orphan
// folderIds on its (rescued) threads, and a "+ New chat" from a thread in
// that orphan state would seed the new chat with a dead folderId — invisible
// in every sidebar group.
export const selectActiveFolderId = (state: RootState) => {
  const id = state.chat.selectedThreadId;
  if (!id) return null;
  const thread = state.chat.threads.find((t) => t.id === id);
  const folderId = thread?.folderId ?? null;
  if (!folderId) return null;
  const folders = state.chat.folders ?? [];
  return folders.some((f) => f.id === folderId) ? folderId : null;
};

export const selectHasAnyThread = (state: RootState): boolean => state.chat.threads.length > 0;

// `?.` guards below cover stale-persisted-state edge cases where the chat
// slice predates folders/notes/attachments/split. Migration backfills the
// fields, but selectors stay defensive so the UI never crashes mid-rehydrate.
//
// Returning EMPTY_MESSAGES (a frozen module-level array) on the no-thread /
// no-messages path keeps reference identity stable across renders. Without
// this, every component subscribed to a thread that has no messages re-renders
// on every dispatch because `[] !== []`.
export const selectMessagesForThread =
  (id: ThreadId | null) =>
  (state: RootState): readonly Message[] => {
    if (!id) return EMPTY_MESSAGES;
    return state.chat.messagesByThread?.[id] ?? EMPTY_MESSAGES;
  };

// Per-thread streaming check. Replaces the old global `selectIsStreaming`
// (which always indexed off `selectedThreadId`) so split-view can show the
// streaming indicator on the correct pane without confusing the main pane.
//
// Pre-existing surfaces that need "is the currently selected thread
// streaming?" should use `selectIsStreamingForSelected` below instead of
// re-allocating a factory call per render.
export const selectIsStreamingForThread =
  (id: ThreadId | null) =>
  (state: RootState): boolean => {
    if (!id) return false;
    const msgs = state.chat.messagesByThread?.[id] ?? EMPTY_MESSAGES;
    return msgs.some((m) => m.streaming);
  };

// Stable selector (no factory) for "the currently selected thread is
// streaming". Reading directly off `selectedThreadId` avoids the per-render
// allocation that a factory selector would force at the call site.
export const selectIsStreamingForSelected = (state: RootState): boolean => {
  const id = state.chat.selectedThreadId;
  if (!id) return false;
  const msgs = state.chat.messagesByThread?.[id] ?? EMPTY_MESSAGES;
  return msgs.some((m) => m.streaming);
};

// Backwards-compat alias. Existing call sites that read "is the selected
// thread streaming" continue to work; new code should prefer the explicit
// `selectIsStreamingForSelected` / `selectIsStreamingForThread(id)` names.
export const selectIsStreaming = selectIsStreamingForSelected;

export const selectFolders = (state: RootState): readonly Folder[] =>
  state.chat.folders ?? [];

export const selectThreadCountInFolder = (folderId: string) => (state: RootState): number =>
  state.chat.threads.filter((t) => t.folderId === folderId).length;

export const selectPendingFolderRenameId = (state: RootState) =>
  state.chat.pendingFolderRenameId ?? null;

export const selectSplitThreadId = (state: RootState): ThreadId | null =>
  state.chat.splitThreadId ?? null;

export const selectAttachmentsForThread =
  (id: ThreadId | null) =>
  (state: RootState): readonly Attachment[] => {
    if (!id) return EMPTY_ATTACHMENTS;
    return state.chat.attachmentsByThread?.[id] ?? EMPTY_ATTACHMENTS;
  };

export const selectNoteForThread =
  (id: ThreadId | null) =>
  (state: RootState): string => {
    if (!id) return EMPTY_NOTE;
    return state.chat.notesByThread?.[id] ?? EMPTY_NOTE;
  };

// ISO-8601 timestamp of the last note edit for this thread. Returns null
// when the thread has no note yet (or when the note has been wiped).
export const selectNoteUpdatedAt =
  (id: ThreadId | null) =>
  (state: RootState): string | null => {
    if (!id) return null;
    return state.chat.notesUpdatedByThread?.[id] ?? null;
  };

const EMPTY_SET: Readonly<Record<ThreadId, true>> = {};

// Multi-selection state — stable empty object for the no-selection case
// so equality checks short-circuit (avoids re-render churn while no rows
// are selected).
export const selectMultiSelectedThreadIds = (
  state: RootState,
): Readonly<Record<ThreadId, true>> =>
  state.chat.multiSelectedThreadIds ?? EMPTY_SET;

export const selectMultiSelectedCount = (state: RootState): number =>
  Object.keys(state.chat.multiSelectedThreadIds ?? EMPTY_SET).length;

// Per-thread compose draft. Returns '' for unknown thread (or null id) so the
// callsite can `value={draft}` straight into a textarea without a guard.
export const selectDraftForThread =
  (id: ThreadId | null) =>
  (state: RootState): string => {
    if (!id) return '';
    return state.chat.draftsByThread?.[id] ?? '';
  };

export const selectInferenceConfig = (state: RootState): InferenceConfig =>
  state.chatConfig.config;

export const selectExpandedPanels = (state: RootState): ChatConfigState['expanded'] =>
  state.chatConfig.expanded;

export const selectIsPanelExpanded =
  (key: PanelKey) =>
  (state: RootState): boolean =>
    state.chatConfig.expanded[key];

// Monotonic "scroll this panel into view" counter — bumped by the `/system`
// slash command. The panel component watches its own key and scrolls when
// the value increases.
export const selectPanelScrollRequest =
  (key: PanelKey) =>
  (state: RootState): number =>
    state.chatConfig.panelScrollRequest?.[key] ?? 0;

export const selectPresets = (state: RootState): readonly Preset[] => state.chatConfig.presets;

export const selectCurrentPresetId = (state: RootState): string =>
  state.chatConfig.currentPresetId;

// `?? []` guards: persisted state predating these fields rehydrates with
// undefined here. Fall back to empty arrays so the UI never crashes on
// `.length`/`.includes` of an undefined value.
export const selectEnabledIntegrationIds = (state: RootState): readonly string[] =>
  state.chatConfig.enabledIntegrationIds ?? [];

export const selectAvailableIntegrations = (
  state: RootState,
): readonly ChatConfigState['availableIntegrations'][number][] =>
  state.chatConfig.availableIntegrations ?? [];

export const selectReasoningEnabled = (state: RootState): boolean =>
  state.chatConfig.reasoningEnabled ?? true;

// Per-thread effective value for the dock's reasoning pill. Returns the
// thread-specific override if the user has set one for that thread,
// otherwise falls back to the global default. The override is `null`-able
// in dispatch (clearing reverts to the global), but selector returns a
// resolved boolean so callers don't have to fork on undefined.
export const selectReasoningEnabledForThread =
  (threadId: ThreadId | null) => (state: RootState): boolean => {
    if (threadId === null) return state.chatConfig.reasoningEnabled ?? true;
    const override = state.chat.reasoningOverridesByThread?.[threadId];
    if (override === undefined) return state.chatConfig.reasoningEnabled ?? true;
    return override;
  };

// UX-CHAT-031: whether the currently-loaded model is a "thinking" (reasoning)
// model. ZL Universe convention: reasoning models carry a `thinking` tag in
// their fixture (e.g. Qwen3 4B Thinking and the DeepSeek R1 distills). The
// shell records this at load time from the model's tags, so the check is
// authoritative for every reasoning model — not just the ones whose id string
// happens to contain "thinking". Gating the dock pill, the simulator trace
// rule, and the regenerate path on the same value keeps them in agreement.
// Returns false when no model is loaded.
export const selectIsThinkingModel = (state: RootState): boolean =>
  selectLoadedModelIsReasoning(state);

// CONFIG-022: lifted from ChatInferencePanel local useState. Persisted via
// the chatConfig slice so navigating away and back, or reloading the app,
// keeps the user on whichever tab they were on.
export const selectInferenceTab = (state: RootState): 'integrations' | 'settings' =>
  state.chatConfig.inferenceTab ?? 'settings';

// NOTE: sidebar sort moved to `@features/settings` — consume
// `selectSidebarSort` / `selectSidebarSortOrder` from there instead.

export const selectChatListCompact = (state: RootState): boolean =>
  state.chatConfig.chatListCompact ?? false;

// Chat-local "is a model ready to use" gate. Wraps shell's modelLoadStatus so
// chat presentation never imports the raw status string in N places. If shell
// adds new states later (e.g. a `warming` step), the gate stays the boundary
// — only this selector flips. UX-CHAT-019 (cross-feature reach in dock)
// traces to this same boundary; centralising the read here is the
// down-payment.
// `ready`     — model fully loaded; chat surface is workable.
// `transient` — load or eject is in progress; CTAs to load another model
//               must be DISABLED (clicking would double-dispatch and
//               race the in-flight thunk).
// `status`    — raw shell value, exposed for branching empty-state copy
//               ("Loading <model>…", "Ejecting…", etc.) without each
//               consumer re-reading from `@features/shell` directly.
export const selectModelGate = (
  state: RootState,
): {
  readonly ready: boolean;
  readonly transient: boolean;
  readonly status: ReturnType<typeof selectModelLoadStatus>;
} => {
  const status = selectModelLoadStatus(state);
  return {
    ready: status === 'loaded',
    transient: status === 'loading' || status === 'unloading',
    status,
  };
};
