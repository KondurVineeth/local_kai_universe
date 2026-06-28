import { delay, jitter } from '@shared/lib/delay';

import type { Message } from '../../domain/entities/Message';
import type {
  ChatStreamSimulator,
  SimulateInferenceConfig,
  SimulateOptions,
  SimulateStopReason,
} from '../../domain/ports/ChatStreamSimulator';
import type { MessageChunk } from '../../domain/ports/MessageChunk';
import type { MessageId } from '../../domain/value-objects/MessageId';
import type { ThreadId } from '../../domain/value-objects/ThreadId';

// Long code mock — used whenever the user's message contains a code-related
// keyword. Long enough to trigger the scroll button in the CodeBlock renderer.
const CODE_REPLY = `Sure! Here's a full implementation of a generic event emitter in TypeScript, followed by a React hook that wires it into a component lifecycle.

You can save this directly into a file named \`EventEmitter.ts\` and import it anywhere in your project.

### 🗂 EventEmitter ( \`EventEmitter.ts\` )

\`\`\`typescript
// ─── EventEmitter ────────────────────────────────────────────────────────────

type Listener<T> = (payload: T) => void;

interface EventMap {
  [event: string]: unknown;
}

export class EventEmitter<TMap extends EventMap = EventMap> {
  private listeners: {
    [K in keyof TMap]?: Set<Listener<TMap[K]>>;
  } = {};

  on<K extends keyof TMap>(event: K, listener: Listener<TMap[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);
    // Returns an unsubscribe function for easy cleanup.
    return () => this.off(event, listener);
  }

  off<K extends keyof TMap>(event: K, listener: Listener<TMap[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof TMap>(event: K, payload: TMap[K]): void {
    this.listeners[event]?.forEach((fn) => fn(payload));
  }

  once<K extends keyof TMap>(event: K, listener: Listener<TMap[K]>): void {
    const wrapper: Listener<TMap[K]> = (payload) => {
      listener(payload);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  clear<K extends keyof TMap>(event?: K): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  listenerCount<K extends keyof TMap>(event: K): number {
    return this.listeners[event]?.size ?? 0;
  }
}

// ─── React hook ──────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';

export function useEventEmitter<TMap extends EventMap>() {
  const emitterRef = useRef(new EventEmitter<TMap>());
  return emitterRef.current;
}

export function useOn<TMap extends EventMap, K extends keyof TMap>(
  emitter: EventEmitter<TMap>,
  event: K,
  listener: Listener<TMap[K]>,
): void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const stable: Listener<TMap[K]> = (payload) => listenerRef.current(payload);
    return emitter.on(event, stable);
  }, [emitter, event]);
}

// ─── Usage example ───────────────────────────────────────────────────────────

interface AppEvents {
  'model:loaded': { modelId: string; contextLength: number };
  'model:unloaded': { modelId: string };
  'generation:token': { token: string; messageId: string };
  'generation:done': { messageId: string; totalTokens: number };
  'error': { code: string; message: string };
}

const appBus = new EventEmitter<AppEvents>();

// Subscribe
const unsub = appBus.on('generation:token', ({ token, messageId }) => {
  console.log(\`[\${messageId}] \${token}\`);
});

// Emit
appBus.emit('model:loaded', { modelId: 'llama-3.1-8b', contextLength: 8192 });
appBus.emit('generation:token', { token: 'Hello', messageId: 'msg_001' });
appBus.emit('generation:done', { messageId: 'msg_001', totalTokens: 312 });

// Cleanup
unsub();
appBus.clear();
\`\`\`

The hook version keeps listener references stable across renders (via \`listenerRef\`) so you don't need to wrap callers in \`useCallback\`. The emitter instance itself lives for the component's lifetime via \`useRef\`.`;

// Java primality mock — a real, correct answer (not a placeholder) so a
// "write a primality test in Java" prompt screenshots as genuine output. Must
// be matched BEFORE the generic CODE_REPLY entry below, otherwise the broad
// 'code'/'write' keywords would swallow it and stream the TypeScript blob.
const JAVA_PRIME_REPLY = `Here's a clean, efficient primality test in Java. It uses 6k±1 trial division, so it only checks 2, 3, and numbers of the form 6k±1 up to √n — every prime greater than 3 is of that form, which skips ~⅔ of the candidates.

\`\`\`java
public final class Primality {

    private Primality() {}

    /**
     * Returns true if {@code n} is a prime number.
     * Runs in O(√n) using 6k±1 trial division.
     */
    public static boolean isPrime(long n) {
        if (n < 2) return false;        // 0 and 1 are not prime
        if (n < 4) return true;         // 2 and 3 are prime
        if (n % 2 == 0 || n % 3 == 0) return false;

        // Every prime > 3 is of the form 6k ± 1, so step by 6.
        for (long i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        for (int n : new int[] { 1, 2, 17, 21, 97, 100, 7919 }) {
            System.out.printf("%d is prime? %b%n", n, isPrime(n));
        }
    }
}
\`\`\`

**How it works**
- Numbers below 2 are rejected outright; 2 and 3 are handled directly.
- Any multiple of 2 or 3 is composite, so those are filtered before the loop.
- The loop tests divisors \`i\` and \`i + 2\` (the 6k−1 / 6k+1 pair), stopping at √n because a composite number must have a factor no larger than its square root.

For very large numbers (cryptographic sizes), switch to the probabilistic **Miller–Rabin** test or Java's built-in \`BigInteger.isProbablePrime(certainty)\` — trial division becomes too slow past ~10¹².`;

// Canned-reply pool. Picks a reply by keyword match on the last user message,
// falls back to a generic one. Tone is brief, helpful, and slightly
// aware-of-being-a-mock so users don't expect deep model behavior.
const REPLIES: ReadonlyArray<{ keywords: readonly string[]; reply: string }> = [
  // Specific before generic: primality must win over the broad 'code' entry.
  {
    keywords: ['primality', 'prime number', 'is prime', 'prime'],
    reply: JAVA_PRIME_REPLY,
  },
  {
    keywords: ['hello', 'hi', 'hey', 'sup'],
    reply:
      "Hello! I'm a simulated response — the real model would be loaded by Universe at this point. Ask me anything and I'll do my best mock.",
  },
  {
    keywords: ['help', 'what can you do'],
    reply:
      "I can pretend to answer questions, write paragraphs, or simulate code completions. Try asking me to explain a concept, summarize a topic, or write a short snippet — I'll stream a canned response back token-by-token.",
  },
  {
    keywords: [
      'code', 'function', 'python', 'javascript', 'typescript',
      'write', 'implement', 'build', 'create', 'react', 'component',
      'class', 'algorithm', 'html', 'css', 'api', 'sort', 'snippet',
    ],
    reply: CODE_REPLY,
  },
  {
    keywords: ['summarize', 'summary', 'tldr'],
    reply:
      'Quick summary: this is a mock chat. The UI streams a canned reply chunk-by-chunk so the input dock, message feed, autoscroll, and persistence behaviors can be exercised without a real backend.',
  },
  {
    keywords: ['why', 'how does', 'explain'],
    reply:
      "Good question. The honest answer: I'm a fixture. I'll appear to think, stream tokens at human reading speed, then stop. Whatever you asked is filed under \"things the real model will handle once it's wired in.\"",
  },
  {
    keywords: ['test', 'testing', 'works'],
    reply:
      'Streaming is working — you should see this message arrive in chunks of 1–4 words at a time, with small pauses between, totalling roughly 1–3 seconds.',
  },
];

const FALLBACK =
  "I'm a simulated assistant — the real model isn't loaded. I can stream canned responses to exercise the chat flow. Once you wire a real backend through the ChatStreamSimulator port, this gets replaced.";

// Continuation-phrase pool. Used by Continue to extend a previous answer
// without producing a new canned reply. Each emits ~50–80 chars so the
// added text feels like a real elaboration.
const CONTINUATIONS: readonly string[] = [
  ' Worth adding: a real model would tailor this to the surrounding context, picking up on tone and prior turns. The simulator just keeps the cadence going so you can exercise the streaming UI.',
  ' To put a finer point on it — once a real backend is wired in, Continue would re-prompt the model with the in-progress message as context and stream additional tokens onto it.',
  ' One more thought. The main thing this exercises is the slice + repository round-trip during a re-stream: the existing message id is preserved, metrics are accumulated, and the persisted snapshot is rewritten on finalize.',
];

// Tunables. Per-chunk delay 30–100ms, total wall time roughly 1–3s.
// Words-per-chunk randomized so streaming doesn't feel mechanical.
const PER_CHUNK_MS_MIN = 30;
const PER_CHUNK_MS_MAX = 100;

// Mock reasoning traces — one is picked when the active model id contains
// "thinking" (matches ZL Universe's reasoning-model naming convention). Streamed
// at faster cadence than the body to feel like genuine deliberation.
const REASONING_TRACES: readonly string[] = [
  "The user is asking a fairly open question. Let me think about what they actually need...\n\nFirst, I should make sure I understand the context. They're talking to a simulated assistant in Universe, a desktop chat client.\n\nThe most useful response is probably brief, friendly, and doesn't pretend to be more than it is. Let me draft something that acknowledges the situation without being awkward about it.",
  "Okay, parsing the question carefully.\n\nKey signals from the user's message: they want a real-feeling interaction. I shouldn't be too verbose, but also shouldn't be so terse that the response feels canned (even though it is canned).\n\nI'll go with a warm, useful one-liner.",
  "Let me consider what an actual thinking model would do here.\n\n1. Read the prompt fully\n2. Identify the user's intent\n3. Generate a draft response\n4. Critique the draft for tone, length, accuracy\n5. Revise and emit\n\nFor this simulated case, the draft is essentially fixed by the keyword match in the canned-reply table. I'll just frame the body to land naturally after this trace.",
];

export class FixtureChatStreamSimulator implements ChatStreamSimulator {
  // eslint-disable-next-line max-lines-per-function
  async *simulate(
    threadId: ThreadId,
    history: readonly Message[],
    options: SimulateOptions = {},
  ): AsyncIterable<MessageChunk> {
    const lastUser = [...history].reverse().find((m) => m.role === 'user');
    const cfg = options.config ?? {};
    const placeholderId = '' as MessageId;
    const signal = options.signal;

    // Context-overflow: when the running history exceeds the loaded model's
    // context window AND the strategy is `error`, the run aborts before any
    // body is emitted (mirrors a real engine refusing to truncate). Other
    // strategies just annotate the reply (see contextOverflowNote).
    const historyTokens = estimateHistoryTokens(history);
    const windowTokens = cfg.contextWindowTokens ?? 0;
    const overflowed = windowTokens > 0 && historyTokens > windowTokens;
    if (overflowed && cfg.contextOverflow === 'error' && !options.continuation) {
      yield {
        threadId,
        messageId: placeholderId,
        delta:
          'Context overflow: the conversation exceeds the model context window and the overflow strategy is set to "Stop and error". Trim the history or pick a different strategy.',
        done: true,
        kind: 'body',
        stopReason: 'Context overflow error',
      };
      return;
    }

    const baseReply = options.continuation
      ? CONTINUATIONS[jitter(0, CONTINUATIONS.length)] ?? CONTINUATIONS[0]!
      : pickReply(lastUser?.content ?? '');
    // Apply Inference Panel knobs to the base reply text. Continuation skips
    // structured-output rewriting so the appended text still reads as prose.
    const reply = options.continuation
      ? decorateWithFooters(baseReply, cfg)
      : applyConfigToReply(baseReply, cfg, overflowed);

    // Skip reasoning trace on continuation.
    if (options.reasoningEnabled && !options.continuation) {
      const trace = REASONING_TRACES[jitter(0, REASONING_TRACES.length)] ?? REASONING_TRACES[0];
      const traceChunks = chunkText(trace ?? '');
      for (const c of traceChunks) {
        if (signal?.aborted) return;
        await delay(jitter(15, 50));
        if (signal?.aborted) return;
        yield { threadId, messageId: placeholderId, delta: c, done: false, kind: 'reasoning' };
      }
      await delay(jitter(150, 350));
      if (signal?.aborted) return;
    }

    // Pacing scales with temperature. Default `0.6` ≈ baseline range.
    // 0 → slow + deterministic feel (1.6× the baseline); 2 → snappy (0.5×).
    const tempMul = pacingMultiplier(cfg.temperature);
    const minMs = Math.round(PER_CHUNK_MS_MIN * tempMul);
    const maxMs = Math.round(PER_CHUNK_MS_MAX * tempMul);

    const chunks = chunkText(reply);
    let accumulated = '';
    let tokens = 0;
    const tokenCap =
      cfg.limitResponseLength && cfg.responseLengthLimit && cfg.responseLengthLimit > 0
        ? cfg.responseLengthLimit
        : Number.POSITIVE_INFINITY;
    const stopStrings = (cfg.stopStrings ?? []).filter((s) => s.length > 0);

    for (let i = 0; i < chunks.length; i++) {
      if (signal?.aborted) return;
      await delay(jitter(minMs, maxMs));
      if (signal?.aborted) return;
      const delta = chunks[i] ?? '';
      accumulated += delta;
      tokens += (delta.match(/\S+/g) ?? []).length;
      const isLast = i === chunks.length - 1;

      // Stop-string hit: emit the chunk that contains the match, then settle.
      const stopHit = stopStrings.find((s) => accumulated.includes(s));
      if (stopHit) {
        yield {
          threadId,
          messageId: placeholderId,
          delta,
          done: true,
          kind: 'body',
          stopReason: 'Stop string hit',
        };
        return;
      }

      // Length cap: same — emit this chunk, settle.
      if (tokens >= tokenCap) {
        yield {
          threadId,
          messageId: placeholderId,
          delta,
          done: true,
          kind: 'body',
          stopReason: 'Length cap reached',
        };
        return;
      }

      yield {
        threadId,
        messageId: placeholderId,
        delta,
        done: isLast,
        kind: 'body',
        ...(isLast ? { stopReason: 'EOS Token Found' as SimulateStopReason } : {}),
      };
    }
  }
}

function pickReply(userText: string): string {
  const lower = userText.toLowerCase();
  for (const { keywords, reply } of REPLIES) {
    if (keywords.some((k) => lower.includes(k))) return reply;
  }
  return FALLBACK;
}

// Apply structured-output / system-prompt / integration / note effects.
// Order: structured-output replaces the reply entirely (canned JSON);
// otherwise we layer system-prompt acknowledgement + footers on top of
// the keyword-picked reply. Goal is one observable change per knob.
function applyConfigToReply(
  base: string,
  cfg: SimulateInferenceConfig,
  overflowed: boolean,
): string {
  if (cfg.structuredOutputEnabled) {
    return structuredOutputReply(cfg.structuredOutputSchema);
  }
  let text = base;
  const preamble = preambleFor(cfg);
  if (preamble) text = `${preamble}\n\n${text}`;
  // Repeat-penalty OFF lets a stock phrase echo; ON dedupes it. Observable
  // mock effect for the repeat-penalty knob.
  text = applyRepeatPenaltyEffect(text, cfg);
  const overflowNote = contextOverflowNote(cfg, overflowed);
  if (overflowNote) text = `${overflowNote}\n\n${text}`;
  return decorateWithFooters(text, cfg);
}

// With repeat-penalty disabled (or set to a no-op 1.0), an unconstrained
// decoder tends to loop — the simulator mimics that by appending a visibly
// repetitive tail. With penalty enabled, no echo. One observable change.
function applyRepeatPenaltyEffect(text: string, cfg: SimulateInferenceConfig): string {
  const penaltyActive = cfg.repeatPenaltyEnabled && (cfg.repeatPenalty ?? 1) > 1.0;
  if (penaltyActive) return text;
  return `${text}\n\n…and to reiterate — and to reiterate — the decoder is looping because repeat-penalty is off.`;
}

// Translate the context-overflow strategy into a one-line note when the
// running history overflows the window. `error` is handled earlier (aborts
// the run); the rest annotate how the prompt was trimmed.
function contextOverflowNote(
  cfg: SimulateInferenceConfig,
  overflowed: boolean,
): string {
  if (!overflowed) return '';
  switch (cfg.contextOverflow) {
    case 'truncate-start':
      return '*(Context window exceeded — dropped the oldest turns.)*';
    case 'rolling-window':
      return '*(Context window exceeded — kept only the most recent turns.)*';
    case 'truncate-middle':
    default:
      return '*(Context window exceeded — trimmed the middle of the conversation.)*';
  }
}

// Whitespace-token estimate of the whole history — used to decide whether
// the context-overflow strategy fires.
function estimateHistoryTokens(history: readonly Message[]): number {
  return history.reduce(
    (n, m) => n + (m.content.match(/\S+/g) ?? []).length,
    0,
  );
}

function preambleFor(cfg: SimulateInferenceConfig): string {
  const bits: string[] = [];
  const sp = cfg.systemPrompt?.trim();
  if (sp) {
    const teaser = sp.length > 60 ? `${sp.slice(0, 60).trimEnd()}…` : sp;
    bits.push(`*(Honoring system prompt: "${teaser}")*`);
  }
  const note = cfg.threadNote?.trim();
  if (note) bits.push('*(Considering this chat\'s notes.)*');
  return bits.join(' ');
}

function decorateWithFooters(text: string, cfg: SimulateInferenceConfig): string {
  let out = text;
  const integrations = (cfg.enabledIntegrations ?? []).filter((s) => s.length > 0);
  if (integrations.length > 0) {
    out = `${out}\n\n*(used: ${integrations.join(', ')})*`;
  }
  const decoding = decodingFooter(cfg);
  if (decoding) out = `${out}\n\n${decoding}`;
  return out;
}

// One-line summary of the active sampling profile. Makes top-K / top-P /
// min-P observable in the rendered reply — every knob the panel exposes
// shows up here when it diverges from a no-op value.
function decodingFooter(cfg: SimulateInferenceConfig): string {
  const bits: string[] = [];
  if (typeof cfg.topK === 'number') bits.push(`top-k ${cfg.topK}`);
  if (cfg.topPEnabled && typeof cfg.topP === 'number') {
    bits.push(`top-p ${cfg.topP.toFixed(2)}`);
  }
  if (cfg.minPEnabled && typeof cfg.minP === 'number' && cfg.minP > 0) {
    bits.push(`min-p ${cfg.minP.toFixed(2)}`);
  }
  if (cfg.repeatPenaltyEnabled && typeof cfg.repeatPenalty === 'number') {
    bits.push(`repeat-penalty ${cfg.repeatPenalty.toFixed(2)}`);
  }
  if (bits.length === 0) return '';
  return `*(decoded with: ${bits.join(' · ')})*`;
}

// Compose a canned JSON reply that loosely matches the schema. Best-effort:
// if the schema parses and has a top-level `properties` object, fill each
// property with a placeholder; otherwise emit a generic shape. The reply is
// a markdown code block so the chat renderer formats it correctly.
function structuredOutputReply(schemaText: string | undefined): string {
  const shape = schemaShape(schemaText);
  return [
    'Returning a structured response per the active schema:',
    '',
    '```json',
    JSON.stringify(shape, null, 2),
    '```',
  ].join('\n');
}

function schemaShape(schemaText: string | undefined): unknown {
  if (!schemaText) return { result: 'simulated value' };
  try {
    const parsed = JSON.parse(schemaText) as { properties?: Record<string, { type?: string }> };
    const props = parsed.properties;
    if (!props || typeof props !== 'object') return { result: 'simulated value' };
    const out: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(props)) {
      out[key] = placeholderForType(def?.type);
    }
    return out;
  } catch {
    return { result: 'simulated value' };
  }
}

function placeholderForType(t: string | undefined): unknown {
  switch (t) {
    case 'string':
      return 'simulated value';
    case 'number':
    case 'integer':
      return 42;
    case 'boolean':
      return true;
    case 'array':
      return ['simulated', 'value'];
    case 'object':
      return { nested: 'value' };
    default:
      return 'simulated value';
  }
}

// Default 0.6, clamped 0–2. Returns a multiplier on the per-chunk delay
// range — higher temperature = shorter delays (snappier feel), lower =
// longer (deliberate). Center stays at 1.0 for the default.
function pacingMultiplier(temperature: number | undefined): number {
  const t = Math.max(0, Math.min(2, temperature ?? 0.6));
  // Linear: t=0 → 1.6×, t=0.6 → 1.0× (baseline), t=2 → 0.5×.
  if (t >= 0.6) return 1.0 - ((t - 0.6) / 1.4) * 0.5; // 1.0 → 0.5
  return 1.0 + ((0.6 - t) / 0.6) * 0.6; // 1.0 → 1.6
}

// Split text into 1–4 word chunks while preserving newlines and code-fence
// boundaries. Code fences emit as their own chunk so the closing ``` doesn't
// land mid-line during streaming.
function chunkText(text: string): readonly string[] {
  const chunks: string[] = [];
  // Split by whitespace but keep the whitespace tokens so we can reassemble.
  const parts = text.split(/(\s+)/).filter(Boolean);
  let buf = '';
  let wordsInBuf = 0;
  const target = () => 1 + Math.floor(Math.random() * 4); // 1-4 words per chunk
  let nextTarget = target();
  for (const part of parts) {
    const isWhitespace = /^\s+$/.test(part);
    buf += part;
    if (!isWhitespace) wordsInBuf++;
    // Flush on newline or when we hit the per-chunk word target.
    if (part.includes('\n') || wordsInBuf >= nextTarget) {
      chunks.push(buf);
      buf = '';
      wordsInBuf = 0;
      nextTarget = target();
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
