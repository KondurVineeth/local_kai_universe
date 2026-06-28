// Server log line shown in the Developer Logs panel. Domain-pure so both
// the static seed list (below) and presentation (the panel + toolbar) can
// reference it without crossing architectural boundaries.
export type LogLevel = 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';

export interface LogEntry {
  readonly id: string;
  readonly timestamp: string; // ISO 8601
  readonly level: LogLevel;
  readonly message: string;
}

// Seed log lines used to populate the Developer Logs panel on fresh server
// start. The clickable mock has no real log stream; the list IS the spec.
// Co-located with the type to keep app + presentation pulling from one
// domain source — no presentation → infrastructure boundary jumps.
export const BOOT_LOG_ENTRIES: readonly Omit<LogEntry, 'id'>[] = [
  { timestamp: '2026-05-16T22:38:44.000Z', level: 'INFO', message: '[ZL UNIVERSE SERVER] Success! HTTP server listening on port 1234' },
  { timestamp: '2026-05-16T22:38:44.001Z', level: 'INFO', message: '' },
  { timestamp: '2026-05-16T22:38:44.002Z', level: 'INFO', message: '[ZL UNIVERSE SERVER] Supported endpoints:' },
  { timestamp: '2026-05-16T22:38:44.003Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]   ZL Universe API' },
  { timestamp: '2026-05-16T22:38:44.004Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  GET  http://localhost:1234/api/v1/models' },
  { timestamp: '2026-05-16T22:38:44.005Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  POST http://localhost:1234/api/v1/chat' },
  { timestamp: '2026-05-16T22:38:44.006Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  POST http://localhost:1234/api/v1/models/load' },
  { timestamp: '2026-05-16T22:38:44.007Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  POST http://localhost:1234/api/v1/models/download' },
  { timestamp: '2026-05-16T22:38:44.008Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  GET  http://localhost:1234/api/v1/models/download/status:job_id' },
  { timestamp: '2026-05-16T22:38:44.009Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]   OpenAI-compatible' },
  { timestamp: '2026-05-16T22:38:44.010Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  GET  http://localhost:1234/v1/models' },
  { timestamp: '2026-05-16T22:38:44.011Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  POST http://localhost:1234/v1/responses' },
  { timestamp: '2026-05-16T22:38:44.012Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  POST http://localhost:1234/v1/chat/completions' },
  { timestamp: '2026-05-16T22:38:44.013Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  POST http://localhost:1234/v1/completions' },
  { timestamp: '2026-05-16T22:38:44.014Z', level: 'INFO', message: '[ZL UNIVERSE SERVER]    ->  POST http://localhost:1234/v1/embeddings' },
  { timestamp: '2026-05-16T22:38:44.015Z', level: 'INFO', message: '' },
  { timestamp: '2026-05-16T22:38:44.016Z', level: 'INFO', message: '[ZL UNIVERSE SERVER] Logs are saved into /Users/user/.zluniverse/server-logs' },
  { timestamp: '2026-05-16T22:38:44.017Z', level: 'INFO', message: 'Server started.' },
  { timestamp: '2026-05-16T22:38:44.018Z', level: 'INFO', message: 'Just-in-time model loading active.' },
];
