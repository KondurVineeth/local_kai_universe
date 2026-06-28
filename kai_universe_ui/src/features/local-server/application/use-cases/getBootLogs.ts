import { BOOT_LOG_ENTRIES } from '../../domain/entities/LogEntry';

import type { LogEntry } from '../../domain/entities/LogEntry';

// Returns the seed log lines used to populate the Developer Logs panel on
// fresh server start. Use-case wrapper so future log streaming can swap
// the body without touching presentation.
//
// `port` rewrites the hardcoded `:1234` in the fixture lines so the boot
// log reflects the port the user actually configured in Server Settings.
export function getBootLogs(port = 1234): readonly Omit<LogEntry, 'id'>[] {
  if (port === 1234) return BOOT_LOG_ENTRIES;
  return BOOT_LOG_ENTRIES.map((entry) => ({
    ...entry,
    message: entry.message.replace(/localhost:1234/g, `localhost:${port}`),
  }));
}
