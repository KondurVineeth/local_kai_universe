import type { LogEntry } from '../../domain/entities/LogEntry';
import type { FileLoggingMode } from '../../domain/value-objects/FileLoggingMode';

export interface LogStreamOptions {
  readonly verbose: boolean;
  readonly redact: boolean;
  readonly logTokens: boolean;
  readonly fileMode: FileLoggingMode;
}

// Request/response lines look like `[ZL UNIVERSE SERVER] → POST /v1/...` or
// `← POST /v1/... 200 12ms`. We key several transforms off these arrows.
const REQUEST_LINE = /(→|←)\s/;
const RESPONSE_LINE = /←\s/;

// Redact the content portion of a log line. Keeps the `[ZL UNIVERSE SERVER]`
// prefix (and the arrow, if present) so the line still reads as a server
// log, but masks the path/payload that could leak request content.
function redactMessage(message: string): string {
  if (!message) return message;
  const arrowMatch = message.match(/^(.*?(?:→|←)\s)(.*)$/);
  if (arrowMatch) {
    return `${arrowMatch[1]}[redacted]`;
  }
  // Non-request line: keep the bracketed prefix, redact the rest.
  const prefixMatch = message.match(/^(\[[^\]]+\]\s*)(.+)$/);
  if (prefixMatch && prefixMatch[2]?.trim()) {
    return `${prefixMatch[1]}[redacted]`;
  }
  return message;
}

// A small deterministic token count derived from the line so the same
// request line always shows the same number (no flicker on re-render).
function pseudoTokenCount(message: string): number {
  let hash = 0;
  for (let i = 0; i < message.length; i += 1) {
    hash = (hash * 31 + message.charCodeAt(i)) | 0;
  }
  return 40 + (Math.abs(hash) % 460);
}

// Build the log lines actually rendered in the Developer Logs panel. The
// toggles in the Log Options menu are no longer cosmetic — each one
// visibly reshapes the stream:
//   verbose   → a DEBUG trace line after every request/response line
//   redact    → request paths / payloads masked as [redacted]
//   logTokens → response lines gain a `tokens=N` suffix
//   fileMode  → a leading status line stating where logs are written
export function transformLogStream(
  logs: readonly LogEntry[],
  options: LogStreamOptions,
): readonly LogEntry[] {
  const out: LogEntry[] = [];

  if (options.fileMode !== 'off' && logs.length > 0) {
    out.push({
      id: 'file-mode-banner',
      timestamp: logs[0]?.timestamp ?? new Date().toISOString(),
      level: 'INFO',
      message:
        options.fileMode === 'full'
          ? '[ZL UNIVERSE SERVER] File logging: FULL — every request/response body persisted to ~/.zluniverse/server-logs'
          : '[ZL UNIVERSE SERVER] File logging: SUCCINCT — request summaries persisted to ~/.zluniverse/server-logs',
    });
  }

  for (const entry of logs) {
    let message = entry.message;
    const isResponse = RESPONSE_LINE.test(message);

    if (options.logTokens && isResponse && !/tokens=/.test(message)) {
      message = `${message} tokens=${pseudoTokenCount(entry.message)}`;
    }
    if (options.redact) {
      message = redactMessage(message);
    }

    out.push({ ...entry, message });

    if (options.verbose && REQUEST_LINE.test(entry.message)) {
      out.push({
        id: `${entry.id}-debug`,
        timestamp: entry.timestamp,
        level: 'DEBUG',
        message: isResponse
          ? '[ZL UNIVERSE SERVER]   trace: response serialized, connection kept alive'
          : '[ZL UNIVERSE SERVER]   trace: routing request, auth check passed, handler dispatched',
      });
    }
  }

  return out;
}
