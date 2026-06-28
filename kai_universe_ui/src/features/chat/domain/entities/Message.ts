import type { Attachment } from './Attachment';
import type { MessageId } from '../value-objects/MessageId';
import type { MessageRole } from '../value-objects/MessageRole';
import type { ThreadId } from '../value-objects/ThreadId';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

// One turn in a chat thread. `content` is plain text in Phase 1; markdown +
// code-block parsing happen at the presentation layer when rendering.
//
// `streaming` is true while chunks are still being appended via the
// AsyncIterable from SendMessage. UI uses it to render a cursor / disable
// the input. Once the stream completes, the message is finalized and
// `streaming` flips to false.
//
// Metrics fields are populated only AFTER streaming completes (per Peak-End
// UX — metadata appearing on done feels satisfying; appearing during stream
// looks broken). All metrics + modelName are optional because user messages
// don't have them.
export interface Message {
  readonly id: MessageId;
  readonly threadId: ThreadId;
  readonly role: MessageRole;
  readonly content: string;
  readonly createdAt: Iso8601;
  readonly streaming: boolean;

  // Per-message metrics (assistant only, set on stream completion)
  readonly modelName?: string;       // e.g. "qwen/qwen3-4b-thinking-2507"
  readonly tokenCount?: number;      // total tokens emitted
  readonly tokensPerSecond?: number; // emit rate
  readonly elapsedMs?: number;       // total stream time
  readonly stopReason?: string;      // e.g. "EOS Token Found"

  // Reasoning trace — populated for "thinking" models (ZL Universe convention:
  // model id contains "thinking"). Rendered as a collapsible "Thought for Xs"
  // disclosure above the message body. Empty/undefined for non-reasoning models.
  readonly reasoningTrace?: string;
  readonly reasoningElapsedMs?: number; // wall time spent in the trace

  // Set when both speculativeDecodingEnabled and visualizeDraftTokens were
  // on at the time of streaming. Renderer highlights alternating tokens as
  // a mock visualization; real backend would emit per-token accepted/
  // rejected metadata which the renderer would consume directly.
  readonly visualizedDraft?: boolean;

  // Attachments carried with this message (user turns only). Snapshotted from
  // the thread's compose-time attachment strip at send so they render
  // inline in the message feed instead of disappearing after send.
  readonly attachments?: readonly Attachment[];

  // Flipped true when the user edits a message's content in place (without a
  // resend). Surfaced as an "edited" badge so an assistant edit doesn't
  // silently rewrite history.
  readonly edited?: boolean;
}
