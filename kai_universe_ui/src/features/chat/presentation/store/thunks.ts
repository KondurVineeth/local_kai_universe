import { simulateRequestThunk } from '@features/local-server';
import { modelPickerOpenRequested, selectLoadedModelId } from '@features/shell';
import { newId } from '@shared/lib/newId';

import {
  appendChunk,
  appendMessage,
  clearMultiSelect,
  createFolder,
  createThread,
  deleteFolder,
  deleteMessage,
  deleteThread,
  finalizeMessage,
  injectBranch,
  markStreaming,
  moveThreadToFolder,
  setMessages,
  updateMessageContent,
} from './slice';

import type { ChatConfigState } from './configSlice';
import type { ChatState } from './slice';
import type { FolderId } from '../../domain/entities/Folder';
import type { Message } from '../../domain/entities/Message';
import type { SimulateInferenceConfig } from '../../domain/ports/ChatStreamSimulator';
import type { MessageId } from '../../domain/value-objects/MessageId';
import type { ThreadId } from '../../domain/value-objects/ThreadId';
import type { AnyAction, ThunkAction } from '@reduxjs/toolkit';
import type { Container } from '@shared/container';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

type ChatThunk<TReturn = void> = ThunkAction<
  TReturn,
  { chat: ChatState; chatConfig: ChatConfigState },
  Container,
  AnyAction
>;

// Active AbortControllers keyed by thread id. The Stop button calls
// `abortStream(threadId)` to interrupt the running simulator. Module-level
// registry is fine here — at most one stream per thread, and the chat slice
// is the source of truth for "which message is streaming".
const activeStreams = new Map<ThreadId, AbortController>();

// BUG-CHAT-FEED-016: Stop-button abort race. If Stop is pressed in the
// window between a thunk starting and it registering its controller in
// `activeStreams`, the abort would be lost (nothing to call `.abort()` on).
// We record the intent here keyed by threadId; `registerStream` consults it
// the moment a controller is created and aborts immediately if a Stop
// already landed. The flag is consumed (deleted) on registration.
const pendingAbort = new Set<ThreadId>();

export function abortStream(threadId: ThreadId): void {
  const controller = activeStreams.get(threadId);
  if (controller) {
    controller.abort();
    activeStreams.delete(threadId);
    return;
  }
  // No controller yet — the stream is mid-startup. Mark the intent so the
  // controller aborts itself the instant it registers.
  pendingAbort.add(threadId);
}

// Create + register a controller for `threadId`. If a Stop press already
// landed during startup, the returned controller is pre-aborted.
function registerStream(threadId: ThreadId): AbortController {
  const controller = new AbortController();
  activeStreams.set(threadId, controller);
  if (pendingAbort.has(threadId)) {
    pendingAbort.delete(threadId);
    controller.abort();
  }
  return controller;
}

// Asks the shell to surface its global model picker. Chat empty-state CTAs
// dispatch this instead of reaching into shell internals or wiring a
// shared-DOM ref. The shell slice flips a monotonic counter; the picker
// observes it and opens. Centralised here so every chat surface uses the
// same affordance and we have one place to swap if the picker becomes a
// modal / route in the future.
export function openModelPickerThunk(): ChatThunk<void> {
  return (dispatch) => {
    dispatch(modelPickerOpenRequested());
  };
}

// Creates a new thread (or surfaces an existing empty one in the same folder
// per the slice's de-dupe rule) and returns the resulting selectedThreadId
// synchronously. Callers can navigate from the click handler using this
// return value — avoids a "ref + effect watching selectedId" dance that
// could leak across unrelated dispatches when the reducer surfaced an
// existing-empty thread (no id change → effect doesn't fire).
export function createThreadThunk(
  options: { folderId?: FolderId | null } = {},
): ChatThunk<ThreadId | null> {
  return (dispatch, getState) => {
    dispatch(createThread({ folderId: options.folderId ?? null }));
    return getState().chat.selectedThreadId;
  };
}

// BUG-CHAT-FEED-002 / SPLIT-008: refuse to start a new stream while one is
// already in flight for this thread. Concurrent streams clobber the controller
// registry, double-stream into the same/different message ids, and the orphan
// finalize stomps the new run's metrics. Callers must Stop first or wait.
function isThreadStreaming(messages: readonly Message[]): boolean {
  return messages.some((m) => m.streaming);
}

// Snapshot the InferenceConfig + per-thread context the simulator reads.
// Centralised so every entry point (send / regenerate / continue / edit-and-
// resend) feeds the simulator the same shape. Names of enabled integrations
// are resolved from id → display name so the simulator can include them
// verbatim in its "(used: …)" footer. `contextWindowTokens` is resolved
// from the loaded model fixture by the caller (see resolveContextWindow).
function buildSimulateConfig(
  state: { chat: ChatState; chatConfig: ChatConfigState },
  threadId: ThreadId,
  contextWindowTokens: number,
): SimulateInferenceConfig {
  const cfg = state.chatConfig.config;
  const enabledNames = state.chatConfig.enabledIntegrationIds
    .map((id) => state.chatConfig.availableIntegrations.find((i) => i.id === id)?.name)
    .filter((n): n is string => typeof n === 'string' && n.length > 0);
  const note = state.chat.notesByThread[threadId];
  return {
    temperature: cfg.temperature,
    limitResponseLength: cfg.limitResponseLength,
    responseLengthLimit: cfg.responseLengthLimit,
    stopStrings: cfg.stopStrings,
    structuredOutputEnabled: cfg.structuredOutputEnabled,
    structuredOutputSchema: cfg.structuredOutputSchema,
    systemPrompt: cfg.systemPrompt,
    enabledIntegrations: enabledNames,
    threadNote: note,
    // All ~6 sampling knobs are now passed through so each has an
    // observable effect in the mock stream.
    topK: cfg.topK,
    topPEnabled: cfg.topPEnabled,
    topP: cfg.topP,
    minPEnabled: cfg.minPEnabled,
    minP: cfg.minP,
    repeatPenaltyEnabled: cfg.repeatPenaltyEnabled,
    repeatPenalty: cfg.repeatPenalty,
    contextOverflow: cfg.contextOverflow,
    contextWindowTokens,
  };
}

// Default context window when no model fixture is loaded / resolvable.
const FALLBACK_CONTEXT_WINDOW_TOKENS = 32_768;

// Resolve the loaded model's context window from the shared model
// repository. Falls back to a fixed 32k when no model is loaded or the
// fixture lookup fails — chat must never hard-crash on this read.
async function resolveContextWindow(
  getState: Parameters<ChatThunk<Promise<void>>>[1],
  container: Container,
): Promise<number> {
  try {
    const loadedId = selectLoadedModelId(getState() as never);
    if (!loadedId) return FALLBACK_CONTEXT_WINDOW_TOKENS;
    const models = await container.modelRepository.list();
    const model = models.find((m) => m.id === loadedId);
    return model?.contextLengthTokens ?? FALLBACK_CONTEXT_WINDOW_TOKENS;
  } catch {
    return FALLBACK_CONTEXT_WINDOW_TOKENS;
  }
}

// BUG-CHAT-FEED-017 / decision (d): wrap repository writes so a genuine
// RepositoryWriteError (quota exceeded, security exception) doesn't escape
// as an unhandled rejection. We surface it to the console — no elaborate
// failure UI, no error-trigger paths. Returns true on success.
async function safeRepoWrite(
  op: () => Promise<void>,
  context: string,
): Promise<boolean> {
  try {
    await op();
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[chat] repository write failed (%s):', context, err);
    return false;
  }
}

// Hydrate a thread's messages from the repository. Resolves to a status the
// caller (MessageFeed) can render a spinner / error branch from. Repository
// reads are wrapped so a genuine read failure surfaces as 'error' rather
// than an unhandled rejection.
export function hydrateThread(
  threadId: ThreadId,
): ChatThunk<Promise<'ok' | 'error'>> {
  return async (dispatch, getState, container) => {
    const sliceHas = (getState().chat.messagesByThread[threadId] ?? []).length > 0;
    if (sliceHas) return 'ok';
    try {
      const messages = await container.chat.chatRepository.listMessages(threadId);
      dispatch(setMessages({ threadId, messages }));
      return 'ok';
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[chat] failed to hydrate thread %s', threadId, err);
      return 'error';
    }
  };
}

// Send a user message and stream the assistant response.
export function sendMessageThunk(
  threadId: ThreadId,
  text: string,
  options: { reasoningEnabled?: boolean } = {},
): ChatThunk<Promise<void>> {
  return async (dispatch, getState, container) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isThreadStreaming(getState().chat.messagesByThread[threadId] ?? [])) {
      // eslint-disable-next-line no-console
      console.warn('[chat] sendMessageThunk: thread %s already streaming; ignored', threadId);
      return;
    }

    // Snapshot any compose-time attachments onto the user Message so they
    // render inline in the feed (not just the transient dock chip strip).
    const pendingAttachments = getState().chat.attachmentsByThread[threadId] ?? [];
    const userMsg: Message = makeMessage(threadId, 'user', trimmed, false, undefined, {
      ...(pendingAttachments.length > 0
        ? { attachments: pendingAttachments.map((a) => ({ ...a })) }
        : {}),
    });
    dispatch(appendMessage({ threadId, message: userMsg }));
    await safeRepoWrite(
      () => container.chat.chatRepository.appendMessage(threadId, userMsg),
      'sendMessage:appendUser',
    );

    // Bridge to the Local Server simulator: when the user sends a real chat
    // message AND the simulated server is running, emit a synthetic
    // `POST /v1/chat/completions` log line so the Local Server feels like
    // it's actually serving the request the chat just made. No-ops when
    // the server isn't running (simulateRequestThunk gates on status).
    const loadedModelId = selectLoadedModelId(getState() as never);
    const promptTokens = Math.max(1, Math.ceil(trimmed.length / 4));
    dispatchCrossFeature(
      dispatch,
      simulateRequestThunk({
        method: 'POST',
        path: '/v1/chat/completions',
        status: 200,
        latencyMs: 180 + Math.floor(Math.random() * 220),
        responseNote: `model=${loadedModelId ?? 'unknown'} prompt_tokens=${promptTokens}`,
      }),
    );

    await streamAssistantResponse(dispatch, getState, container, threadId, options);
  };
}

// The chat thunk's typed state is `{ chat, chatConfig }` but
// `simulateRequestThunk` is typed for `{ localServer }`. Both end up on the
// same store at runtime; the cast keeps TypeScript honest about the
// cross-feature call without leaking a `RootState` import into chat.
function dispatchCrossFeature(
  dispatch: (action: unknown) => unknown,
  thunk: unknown,
): void {
  dispatch(thunk);
}

// Drop the assistant message (and any after) and re-stream a fresh response
// based on the conversation up through the user message that preceded it.
export function regenerateThunk(
  threadId: ThreadId,
  assistantMessageId: MessageId,
  options: { reasoningEnabled?: boolean } = {},
): ChatThunk<Promise<void>> {
  return async (dispatch, getState, container) => {
    const messages = getState().chat.messagesByThread[threadId] ?? [];
    if (isThreadStreaming(messages)) {
      // BUG-CHAT-SPLIT-008: regenerate while streaming would clobber the
      // controller and double-stream. Caller must Stop first.
      // eslint-disable-next-line no-console
      console.warn('[chat] regenerateThunk: thread %s already streaming; ignored', threadId);
      return;
    }
    const idx = messages.findIndex((m) => m.id === assistantMessageId);
    if (idx === -1) return;
    // Truncate the message list to everything before the assistant turn.
    const kept = messages.slice(0, idx);
    dispatch(setMessages({ threadId, messages: kept }));
    // BUG-CHAT-FEED-007: persist truncation BEFORE streaming so a mid-regen
    // crash/reload can't resurrect the dropped assistant turn from the repo.
    await safeRepoWrite(
      () => container.chat.chatRepository.replaceMessages(threadId, kept),
      'regenerate:truncate',
    );
    await streamAssistantResponse(dispatch, getState, container, threadId, options);
  };
}

// Keep the assistant message; stream more body chunks and append them.
export function continueThunk(
  threadId: ThreadId,
  assistantMessageId: MessageId,
): ChatThunk<Promise<void>> {
  return async (dispatch, getState, container) => {
    const messages = getState().chat.messagesByThread[threadId] ?? [];
    if (isThreadStreaming(messages)) {
      // eslint-disable-next-line no-console
      console.warn('[chat] continueThunk: thread %s already streaming; ignored', threadId);
      return;
    }
    const target = messages.find((m) => m.id === assistantMessageId);
    if (!target) return;

    // BUG-CHAT-FEED-004: flip streaming:true on the existing message before
    // chunks arrive so the assistant bubble shows the streaming cursor /
    // skeleton during the continue pass. The previous code dispatched a
    // pre-stream `finalizeMessage` here, which actually set streaming:false
    // and left it false for the entire continue (since `appendChunk` doesn't
    // touch the flag).
    dispatch(markStreaming({ threadId, messageId: assistantMessageId }));

    const controller = registerStream(threadId);
    const startMs = Date.now();
    let tokenCount = target.tokenCount ?? 0;
    // BUG-CHAT-FEED-005: track whether the simulator drained naturally so we
    // can distinguish a real EOS from a Stop press that arrived on the last
    // chunk (controller.signal.aborted alone can't tell those apart).
    let lastChunkDone = false;
    let stopReasonFromSim: string | undefined;
    const contextWindow = await resolveContextWindow(getState, container);
    const simulateConfig = buildSimulateConfig(getState(), threadId, contextWindow);
    try {
      for await (const chunk of container.chat.chatStreamSimulator.simulate(
        threadId,
        messages,
        { signal: controller.signal, continuation: true, config: simulateConfig },
      )) {
        if (controller.signal.aborted) break;
        if ((chunk.kind ?? 'body') !== 'body') continue;
        // BUG-CHAT-FEED-006: count whitespace-split tokens in the chunk
        // delta instead of one-per-chunk. Simulator chunks contain 1–4
        // words; the previous "+= 1" produced a tokenCount roughly 2.5×
        // smaller than reality and a t/s metric to match.
        tokenCount += (chunk.delta.match(/\S+/g) ?? []).length;
        dispatch(
          appendChunk({ threadId, messageId: assistantMessageId, delta: chunk.delta, kind: 'body' }),
        );
        if (chunk.done) {
          lastChunkDone = true;
          stopReasonFromSim = chunk.stopReason;
          break;
        }
      }
    } finally {
      activeStreams.delete(threadId);
    }

    const elapsedMs = (target.elapsedMs ?? 0) + (Date.now() - startMs);
    const tokensPerSecond =
      elapsedMs > 0 ? Number(((tokenCount * 1000) / elapsedMs).toFixed(2)) : 0;
    dispatch(
      finalizeMessage(
        // BUG-CHAT-FEED-012: strip undefined keys so a stale field on the
        // existing message isn't accidentally re-asserted-as-undefined by
        // the spread inside the reducer.
        stripUndefined({
          threadId,
          messageId: assistantMessageId,
          tokenCount,
          tokensPerSecond,
          elapsedMs,
          stopReason:
            stopReasonFromSim ?? (lastChunkDone ? 'EOS Token Found' : 'User cancelled'),
        }),
      ),
    );
    await persistThread(getState, container, threadId);
  };
}

// Clone messages up through and including the clicked message into a new
// thread, switch to it, and return the new thread id (for navigation).
export function branchFromMessageThunk(
  threadId: ThreadId,
  messageId: MessageId,
): ChatThunk<Promise<ThreadId | null>> {
  return async (dispatch, getState, container) => {
    const state = getState();
    const sourceThread = state.chat.threads.find((t) => t.id === threadId);
    const sourceMessages = state.chat.messagesByThread[threadId] ?? [];
    const idx = sourceMessages.findIndex((m) => m.id === messageId);
    if (!sourceThread || idx === -1) return null;

    // Refuse to branch off a thread that has any in-flight stream — capturing
    // a `streaming:true` message would copy a half-written turn and leave the
    // branch with a phantom "still streaming" flag (no controller wired). The
    // user's intent is "snapshot this conversation", and a snapshot of a
    // mid-stream turn isn't well-defined. Fail closed and warn.
    if (sourceMessages.some((m) => m.streaming)) {
      // eslint-disable-next-line no-console
      console.warn('[branchFromMessageThunk] refusing to branch while a message is streaming');
      return null;
    }

    const kept = sourceMessages.slice(0, idx + 1);

    const newThreadId = newId('t') as ThreadId;
    // SPLIT-003: `injectBranch` seeds `messagesByThread` directly (it does
    // NOT route through `appendMessage`), so it never touches the
    // `messageCount` counter. The branch thread must therefore carry the
    // correct count from the start — set it once here from `kept.length`.
    // (The earlier comment claiming this was a double-set was wrong.)
    const newThread = {
      id: newThreadId,
      title: `${sourceThread.title} (branch)`,
      createdAt: new Date().toISOString() as Iso8601,
      messageCount: kept.length,
      // Inherit the source thread's folder so the branch lands next to its
      // parent. Pin is intentionally NOT inherited — branches start un-pinned.
      folderId: sourceThread.folderId ?? null,
    };
    // Strip `streaming` (force false) when cloning. Even though we bail above
    // on any streaming message, defense-in-depth: future callers that bypass
    // the guard shouldn't be able to leak a streaming flag into a branch.
    const clonedMessages: Message[] = kept.map((m) => ({
      ...m,
      id: newId('m') as MessageId,
      threadId: newThreadId,
      streaming: false,
    }));

    // Carry over notes and attachments so the branch is a true working copy
    // (mirrors duplicateThread). Without this, opening a branch loses any
    // sticky note the user pinned to the source.
    const sourceNote = state.chat.notesByThread[threadId];
    const sourceAttachments = state.chat.attachmentsByThread[threadId];

    await safeRepoWrite(
      () => container.chat.chatRepository.saveThread(newThread),
      'branch:saveThread',
    );
    await safeRepoWrite(
      () => container.chat.chatRepository.replaceMessages(newThreadId, clonedMessages),
      'branch:replaceMessages',
    );

    dispatch(
      injectBranch({
        thread: newThread,
        messages: clonedMessages,
        note: sourceNote,
        attachments: sourceAttachments,
      }),
    );
    return newThreadId;
  };
}

// Update a user message's content, drop everything after it, and re-stream
// the assistant response for the edited prompt.
export function editAndResendThunk(
  threadId: ThreadId,
  userMessageId: MessageId,
  newContent: string,
  options: { reasoningEnabled?: boolean } = {},
): ChatThunk<Promise<void>> {
  return async (dispatch, getState, container) => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    const messages = getState().chat.messagesByThread[threadId] ?? [];
    if (isThreadStreaming(messages)) {
      // BUG-CHAT-SPLIT-006: edit+resend mid-stream would orphan the assistant.
      // eslint-disable-next-line no-console
      console.warn('[chat] editAndResendThunk: thread %s already streaming; ignored', threadId);
      return;
    }
    const idx = messages.findIndex((m) => m.id === userMessageId);
    if (idx === -1) return;
    const target = messages[idx];
    if (!target || target.role !== 'user') return;
    const updated: Message = { ...target, content: trimmed };
    const kept = [...messages.slice(0, idx), updated];
    dispatch(setMessages({ threadId, messages: kept }));
    // BUG-CHAT-FEED-007: persist edited+truncated history BEFORE streaming
    // so a mid-stream crash can't resurrect the dropped tail from the repo.
    await safeRepoWrite(
      () => container.chat.chatRepository.replaceMessages(threadId, kept),
      'editAndResend:truncate',
    );
    await streamAssistantResponse(dispatch, getState, container, threadId, options);
  };
}

// ── shared streaming helper ─────────────────────────────────────────────────

async function streamAssistantResponse(
  dispatch: Parameters<ChatThunk<Promise<void>>>[0],
  getState: Parameters<ChatThunk<Promise<void>>>[1],
  container: Container,
  threadId: ThreadId,
  options: { reasoningEnabled?: boolean },
): Promise<void> {
  // Snapshot the inference config at stream start so visualization /
  // structured-output flags reflect what was on at the moment the user
  // pressed send — not whatever they toggle to mid-stream.
  const cfg = getState().chatConfig.config;
  const visualizedDraft = cfg.speculativeDecodingEnabled && cfg.visualizeDraftTokens;
  const contextWindow = await resolveContextWindow(getState, container);
  const simulateConfig = buildSimulateConfig(getState(), threadId, contextWindow);
  const assistantId = newId('m') as MessageId;
  const assistantMsg: Message = makeMessage(threadId, 'assistant', '', true, assistantId);
  dispatch(appendMessage({ threadId, message: assistantMsg }));
  // BUG-CHAT-FEED-008: persist the placeholder at stream START so a mid-stream
  // crash leaves the repo with the (empty) assistant turn, not nothing. We
  // re-write the final message list once at finalize via persistThread; per-
  // chunk persistence would be too chatty for localStorage.
  await safeRepoWrite(
    () => container.chat.chatRepository.appendMessage(threadId, assistantMsg),
    'stream:appendPlaceholder',
  );

  const history = getState().chat.messagesByThread[threadId] ?? [];

  const controller = registerStream(threadId);
  const startMs = Date.now();
  let reasoningStartMs = 0;
  let reasoningEndMs = 0;
  let tokenCount = 0;
  // BUG-CHAT-FEED-005: track loop-drained vs externally-aborted so a Stop
  // press timed with the final chunk doesn't get mislabeled "User cancelled"
  // on a fully-complete reply.
  let lastChunkDone = false;
  let stopReasonFromSim: string | undefined;
  let errored = false;
  try {
    for await (const chunk of container.chat.chatStreamSimulator.simulate(threadId, history, {
      reasoningEnabled: options.reasoningEnabled,
      signal: controller.signal,
      config: simulateConfig,
    })) {
      if (controller.signal.aborted) break;
      const kind = chunk.kind ?? 'body';
      if (kind === 'reasoning') {
        if (reasoningStartMs === 0) reasoningStartMs = Date.now();
        reasoningEndMs = Date.now();
      } else {
        // BUG-CHAT-FEED-006: count whitespace-split tokens in the body delta
        // (was: chunks). Reasoning chunks remain uncounted — they don't
        // belong to the body t/s metric the user sees.
        tokenCount += (chunk.delta.match(/\S+/g) ?? []).length;
      }
      dispatch(appendChunk({ threadId, messageId: assistantId, delta: chunk.delta, kind }));
      if (chunk.done) {
        lastChunkDone = true;
        stopReasonFromSim = chunk.stopReason;
        break;
      }
    }
  } catch (err) {
    // BUG-CHAT-FEED-003: any thrown error during streaming must still finalize
    // so the placeholder doesn't sit stuck at streaming:true forever.
    errored = true;
    // eslint-disable-next-line no-console
    console.error('[chat] stream error on thread %s', threadId, err);
  } finally {
    // Only clear the registry slot if we still own it; a concurrent abort+
    // restart could have replaced our entry.
    if (activeStreams.get(threadId) === controller) activeStreams.delete(threadId);
  }

  // BUG-CHAT-FEED-001 / SPLIT-006: if the message was deleted mid-stream
  // (thread/message deleted), skip finalize so the slice's id-not-found path
  // doesn't accidentally resurrect or no-op confusingly.
  const stillExists = (getState().chat.messagesByThread[threadId] ?? []).some(
    (m) => m.id === assistantId,
  );
  if (!stillExists) return;

  await dispatchFinalize(dispatch, container, {
    threadId,
    assistantId,
    startMs,
    reasoningStartMs,
    reasoningEndMs,
    tokenCount,
    errored,
    lastChunkDone,
    stopReasonFromSim,
    visualizedDraft,
  });
  await persistThread(getState, container, threadId);
}

// Compute and dispatch the finalizeMessage payload for a completed stream.
// Extracted so streamAssistantResponse stays under the 80-line cap; nothing
// here is reused elsewhere yet.
async function dispatchFinalize(
  dispatch: Parameters<ChatThunk<Promise<void>>>[0],
  container: Container,
  args: {
    threadId: ThreadId;
    assistantId: MessageId;
    startMs: number;
    reasoningStartMs: number;
    reasoningEndMs: number;
    tokenCount: number;
    errored: boolean;
    lastChunkDone: boolean;
    stopReasonFromSim?: string | undefined;
    visualizedDraft: boolean;
  },
): Promise<void> {
  const elapsedMs = Date.now() - args.startMs;
  const reasoningElapsedMs =
    args.reasoningStartMs > 0 && args.reasoningEndMs >= args.reasoningStartMs
      ? args.reasoningEndMs - args.reasoningStartMs
      : undefined;
  // BUG-CHAT-FEED-015: t/s denominator excludes the reasoning phase since
  // tokenCount only counts body tokens. Clamp to >=1ms to avoid /0.
  const tsDenomMs = Math.max(1, elapsedMs - (reasoningElapsedMs ?? 0));
  const tokensPerSecond =
    elapsedMs > 0 ? Number(((args.tokenCount * 1000) / tsDenomMs).toFixed(2)) : 0;
  const models = await container.modelRepository.list();
  const firstModel = models[0];
  const modelName = firstModel ? `${firstModel.author}/${firstModel.id}` : 'simulated';
  // BUG-CHAT-FEED-003 + FEED-005: error first; otherwise prefer the
  // simulator's named reason (Stop string hit / Length cap reached) when it
  // settles the stream itself, falling back to drained-vs-aborted.
  const stopReason = args.errored
    ? 'Error'
    : (args.stopReasonFromSim ?? (args.lastChunkDone ? 'EOS Token Found' : 'User cancelled'));
  dispatch(
    finalizeMessage(
      // BUG-CHAT-FEED-012: strip undefined keys so the reducer-side spread
      // doesn't reassert a stale field as `undefined` on regenerate.
      stripUndefined({
        threadId: args.threadId,
        messageId: args.assistantId,
        modelName,
        tokenCount: args.tokenCount,
        tokensPerSecond,
        elapsedMs,
        stopReason,
        reasoningElapsedMs,
        visualizedDraft: args.visualizedDraft,
      }),
    ),
  );
}

// Drop keys whose value is `undefined` so they don't survive the reducer
// spread and overwrite an existing populated field on the target message.
// (BUG-CHAT-FEED-012 — defense in depth.)
function stripUndefined<T extends Record<string, unknown>>(payload: T): T {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(payload)) {
    const v = payload[k];
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

async function persistThread(
  getState: Parameters<ChatThunk<Promise<void>>>[1],
  container: Container,
  threadId: ThreadId,
): Promise<void> {
  const finalMessages = getState().chat.messagesByThread[threadId] ?? [];
  await safeRepoWrite(
    () => container.chat.chatRepository.replaceMessages(threadId, finalMessages),
    'persistThread',
  );
}

// Re-export deleteMessage for surfaces that need to drop a message without a
// resend (e.g. the assistant trash icon). Most callers should prefer the
// thunk below; the raw action is kept for tests and non-streaming paths.
export { deleteMessage };

// BUG-CHAT-FEED-001 / SPLIT-006: deleting a thread mid-stream must abort the
// in-flight stream so its tail chunks can't land on a stale or recreated
// thread, then drop the slice + repo entries atomically.
export function deleteThreadThunk(threadId: ThreadId): ChatThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    abortStream(threadId);
    dispatch(deleteThread(threadId));
    await safeRepoWrite(
      () => container.chat.chatRepository.deleteThread(threadId),
      'deleteThread',
    );
  };
}

// Wipes every message on a thread but keeps the thread itself + folder
// + notes. Powers the composer `/clear` slash-command. Aborts any in-
// flight stream first so trailing chunks don't resurrect the cleared list.
export function clearThreadThunk(threadId: ThreadId): ChatThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    abortStream(threadId);
    dispatch(setMessages({ threadId, messages: [] }));
    await safeRepoWrite(
      () => container.chat.chatRepository.replaceMessages(threadId, []),
      'clearThread',
    );
  };
}

// Deleting a folder cascades to its child threads. The slice reducer
// `deleteFolder` already drops the threads + side-channel state, but the
// `chatRepository` (localStorage-backed) keeps the per-thread message arrays
// keyed by threadId — slice cleanup alone leaves orphaned messages that
// resurrect on the next `listMessages` call. Mirror `deleteThreadsThunk`'s
// pattern: abort streams, then sequentially evict from the repo.
export function deleteFolderThunk(folderId: FolderId): ChatThunk<Promise<void>> {
  return async (dispatch, getState, container) => {
    const doomedThreadIds = getState()
      .chat.threads.filter((t) => t.folderId === folderId)
      .map((t) => t.id);
    for (const id of doomedThreadIds) abortStream(id);
    dispatch(deleteFolder(folderId));
    for (const id of doomedThreadIds) {
      await safeRepoWrite(
        () => container.chat.chatRepository.deleteThread(id),
        'deleteFolder:deleteThread',
      );
    }
  };
}

// Bulk-delete: aborts every active stream first, then drops slice + repo
// entries thread-by-thread. Used by the multi-select bar in the sidebar.
// Sequential repo writes (not Promise.all) so localStorage doesn't hit a
// quota race when many threads carry large message lists.
export function deleteThreadsThunk(
  threadIds: readonly ThreadId[],
): ChatThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    for (const id of threadIds) abortStream(id);
    for (const id of threadIds) {
      dispatch(deleteThread(id));
      await safeRepoWrite(
        () => container.chat.chatRepository.deleteThread(id),
        'deleteThreads:deleteThread',
      );
    }
    dispatch(clearMultiSelect());
  };
}

// Create a fresh folder and move every thread in `threadIds` into it.
// Powers "Move to new folder…" in the multi-select bar. Reads the freshly
// created folder id from `pendingFolderRenameId` (createFolder sets it),
// dispatches per-thread moves, then clears the multi-select set so the
// bar collapses on success.
export function moveThreadsToNewFolderThunk(
  threadIds: readonly ThreadId[],
  folderName = 'New Folder',
): ChatThunk<FolderId | null> {
  return (dispatch, getState) => {
    dispatch(createFolder(folderName));
    const newFolderId = getState().chat.pendingFolderRenameId;
    if (!newFolderId) return null;
    for (const id of threadIds) {
      dispatch(moveThreadToFolder({ id, folderId: newFolderId }));
    }
    dispatch(clearMultiSelect());
    return newFolderId;
  };
}

// BUG-CHAT-FEED-001 / SPLIT-006: deleting a message mid-stream must abort the
// stream first; otherwise appendChunk lands on the missing id (now warned via
// FEED-011) and finalize would silently no-op while leaving the registry
// pointing at a controller for a deleted message.
export function deleteMessageThunk(
  threadId: ThreadId,
  messageId: MessageId,
): ChatThunk<Promise<void>> {
  return async (dispatch, getState, container) => {
    const messages = getState().chat.messagesByThread[threadId] ?? [];
    const target = messages.find((m) => m.id === messageId);
    if (target?.streaming || isThreadStreaming(messages)) {
      abortStream(threadId);
    }
    dispatch(deleteMessage({ threadId, messageId }));
    const next = getState().chat.messagesByThread[threadId] ?? [];
    await safeRepoWrite(
      () => container.chat.chatRepository.replaceMessages(threadId, next),
      'deleteMessage',
    );
  };
}

// BUG-CHAT-SPLIT-013: edit-save was dispatching updateMessageContent against
// the slice only; the repo retained the old content, and a reload reverted
// the edit. Persist together with the slice update.
export function updateMessageThunk(
  threadId: ThreadId,
  messageId: MessageId,
  content: string,
): ChatThunk<Promise<void>> {
  return async (dispatch, getState, container) => {
    // Stamp `edited` so an in-place edit (no resend) surfaces an "edited"
    // badge — the edit no longer silently rewrites history.
    dispatch(updateMessageContent({ threadId, messageId, content, edited: true }));
    const next = getState().chat.messagesByThread[threadId] ?? [];
    await safeRepoWrite(
      () => container.chat.chatRepository.replaceMessages(threadId, next),
      'updateMessage',
    );
  };
}

function makeMessage(
  threadId: ThreadId,
  role: Message['role'],
  content: string,
  streaming: boolean,
  id?: MessageId,
  extra?: Partial<Message>,
): Message {
  return {
    id: id ?? (newId('m') as MessageId),
    threadId,
    role,
    content,
    createdAt: nowIso(),
    streaming,
    ...extra,
  };
}

function nowIso(): Iso8601 {
  return new Date().toISOString() as Iso8601;
}
