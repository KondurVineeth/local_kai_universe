import type { Message } from '../../domain/entities/Message';
import type { Thread } from '../../domain/entities/Thread';

export type ExportFormat = 'markdown' | 'json';

// Escape characters that would otherwise be interpreted as Markdown structure
// when they appear at the start of a line — `#` (heading injection), `>`
// (blockquote), `-`/`*`/`+` (list bullets). Inline `#` etc. are fine; we only
// need to neutralize line-leading chars that change block-level rendering.
function escapeMarkdownBlock(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/^([#>*+-])/, '\\$1'))
    .join('\n');
}

// Escape an unsafe substring so it can't be interpreted as raw HTML inside a
// Markdown document. Critically, this includes `</details>` — without this
// step, a user message containing the literal `</details>` would terminate
// the reasoning disclosure block early and leak the rest of the message into
// the surrounding markup.
function escapeAngleBrackets(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Serialize a thread + messages to a downloadable string. Markdown export is
// the most readable; JSON preserves structure for re-import down the road.
export function serializeThread(
  thread: Thread,
  messages: readonly Message[],
  format: ExportFormat,
): string {
  if (format === 'json') {
    return JSON.stringify({ thread, messages }, null, 2);
  }
  // Headings + body: angle-brackets escaped (so `<script>` in a title
  // doesn't render as raw HTML when the markdown is later viewed in a
  // permissive renderer), block-leading metacharacters escaped (so a user
  // message starting with `# ` doesn't masquerade as a heading).
  const lines: string[] = [
    `# ${escapeAngleBrackets(thread.title)}`,
    '',
    `_Created ${new Date(thread.createdAt).toLocaleString()}_`,
    '',
  ];

  if (messages.length === 0) {
    // CORE-012: an empty export was producing a near-empty .md with just the
    // title. Surface the absence of content so the file is self-documenting.
    lines.push('_(no messages yet)_', '');
    return lines.join('\n');
  }

  for (const m of messages) {
    if (m.role === 'user') {
      lines.push('## You', '', escapeMarkdownBlock(m.content), '');
    } else {
      lines.push(`## ${escapeAngleBrackets(m.modelName ?? 'Assistant')}`, '');
      if (m.reasoningTrace?.trim()) {
        // CORE-011: wrap the reasoning trace inside the <details> block so
        // any literal `</details>` in the trace can't terminate the
        // disclosure prematurely. Using a fenced code block is too lossy for
        // markdown reasoning; angle-bracket escaping preserves readability.
        lines.push(
          '<details><summary>Reasoning</summary>',
          '',
          escapeAngleBrackets(m.reasoningTrace),
          '',
          '</details>',
          '',
        );
      }
      lines.push(escapeMarkdownBlock(m.content), '');
    }
  }
  return lines.join('\n');
}

export function downloadString(filename: string, contents: string, mime: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke; some browsers race on inline removal.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportThread(
  thread: Thread,
  messages: readonly Message[],
  format: ExportFormat,
): void {
  const safeTitle =
    thread.title.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'chat';
  const ext = format === 'json' ? 'json' : 'md';
  const mime = format === 'json' ? 'application/json' : 'text/markdown';
  // CORE-010: append a slice of the thread id so two chats with the same
  // sanitized title don't overwrite each other in the user's downloads
  // folder. 6 chars of the id is enough to disambiguate within a session
  // without making filenames unreadable.
  const idSuffix = thread.id.slice(0, 6);
  downloadString(
    `${safeTitle}-${idSuffix}.${ext}`,
    serializeThread(thread, messages, format),
    mime,
  );
}
