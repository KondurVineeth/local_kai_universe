import type { MessageChunk } from './MessageChunk';
import type { Message } from '../entities/Message';
import type { ThreadId } from '../value-objects/ThreadId';

// Streams a simulated assistant response chunk-by-chunk. Implementations
// (FixtureChatStreamSimulator) pick a canned reply, split it into chunks,
// and yield with realistic per-chunk delays.
//
// Once a real backend lands, an HttpChatStreamSimulator would consume the
// model's SSE stream and yield chunks here — same port, different adapter.

// Subset of InferenceConfig fields the simulator actually reflects in mock
// behaviour. Every Inference Panel knob now has at least one observable
// effect on the stream — the sampling knobs (top-K / top-P / min-P /
// repeat-penalty) and context-overflow are surfaced via a synthetic
// "decoding footer" the simulator appends, and context-overflow drives a
// truncation note when the history exceeds the context window.
export type ContextOverflowStrategy =
  | 'truncate-middle'
  | 'truncate-start'
  | 'rolling-window'
  | 'error';

export interface SimulateInferenceConfig {
  readonly temperature?: number;
  readonly limitResponseLength?: boolean;
  readonly responseLengthLimit?: number;
  readonly stopStrings?: readonly string[];
  readonly structuredOutputEnabled?: boolean;
  readonly structuredOutputSchema?: string;
  readonly systemPrompt?: string;
  // Names of currently-enabled plugins/integrations (e.g. "Web Search").
  // When non-empty, the simulator appends a "(used: …)" footer chunk.
  readonly enabledIntegrations?: readonly string[];
  // Per-thread sticky note. When present, the simulator references it in
  // the reply preamble.
  readonly threadNote?: string;
  // Sampling knobs — each produces an observable mock effect (see
  // FixtureChatStreamSimulator.decodingFooter / pickReply variance).
  readonly topK?: number;
  readonly topPEnabled?: boolean;
  readonly topP?: number;
  readonly minPEnabled?: boolean;
  readonly minP?: number;
  readonly repeatPenaltyEnabled?: boolean;
  readonly repeatPenalty?: number;
  readonly contextOverflow?: ContextOverflowStrategy;
  // Context window size (tokens) of the loaded model — used to decide
  // whether the context-overflow strategy note fires.
  readonly contextWindowTokens?: number;
}

export type SimulateStopReason =
  | 'EOS Token Found'
  | 'Stop string hit'
  | 'Length cap reached'
  | 'Context overflow error';

export interface SimulateOptions {
  readonly reasoningEnabled?: boolean;
  // When true, the simulator yields a continuation-phrase pool instead of
  // a fresh canned reply — used by the Continue action so the appended
  // text reads as "more of the same" rather than a brand-new answer.
  readonly continuation?: boolean;
  // Honored by the simulator: when the signal aborts, the AsyncIterable
  // breaks out of the inner delay and stops yielding. Lets the UI's Stop
  // button cancel mid-stream without the response being orphaned.
  readonly signal?: AbortSignal;
  // Snapshot of Inference Panel state at stream-start. The simulator reads
  // from this so user-facing knobs (temperature, stop strings, response-
  // length cap, structured output, system prompt, integrations, notes)
  // each have at least one observable effect on the reply.
  readonly config?: SimulateInferenceConfig;
}

export interface ChatStreamSimulator {
  /**
   * @param threadId — thread the response belongs to
   * @param history  — full message history to react to (last user message
   *                   is what we're responding to)
   * @param options  — `reasoningEnabled` makes the simulator emit a
   *                   reasoning trace (kind: 'reasoning') before the body;
   *                   `config` is a snapshot of Inference Panel state.
   * @returns AsyncIterable of MessageChunk; consumer collects deltas and
   *          finalizes when `done: true` is received
   */
  simulate(
    threadId: ThreadId,
    history: readonly Message[],
    options?: SimulateOptions,
  ): AsyncIterable<MessageChunk>;
}
