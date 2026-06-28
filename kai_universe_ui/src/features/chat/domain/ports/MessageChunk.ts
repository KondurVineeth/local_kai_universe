import type { SimulateStopReason } from './ChatStreamSimulator';
import type { MessageId } from '../value-objects/MessageId';
import type { ThreadId } from '../value-objects/ThreadId';

// One streamed token group from the assistant. Application layer iterates
// these; presentation layer dispatches each one as a Redux action so the
// UI re-renders incrementally. The final chunk has `done: true`.
//
// `kind` distinguishes reasoning trace from message body. The trace renders
// in the collapsible "Thought for Xs" disclosure above the body for
// reasoning-capable models; default is 'body' when omitted.
//
// `stopReason` is set on the final chunk when the simulator can name the
// cause (stop-string hit, length cap reached). When absent, the consumer
// derives it from abort state (user cancelled vs natural EOS).
export interface MessageChunk {
  readonly threadId: ThreadId;
  readonly messageId: MessageId;
  readonly delta: string;
  readonly done: boolean;
  readonly kind?: 'body' | 'reasoning';
  readonly stopReason?: SimulateStopReason;
}
