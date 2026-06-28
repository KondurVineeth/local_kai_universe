// Derive an auto-title from the first user message.
//
// Edge cases the previous implementation got wrong (BUG-CHAT-CORE-009):
// - Whitespace-only / emoji-only / punctuation-only input returned "" —
//   leaving the chat with the literal placeholder "New Chat" or worse, an
//   empty string in the sidebar.
// - Only ASCII trailing punctuation was stripped — Unicode punctuation
//   (`。！？「」…`) survived and led to messy titles.
// - No per-word length cap meant a single 200-char "word" pasted by the
//   user blew past the 60-char overall cap mid-word with an unsightly cut.
//
// Rules now:
//   1. Trim, strip Unicode punctuation, collapse whitespace.
//   2. If nothing meaningful remains, fall back to "New Chat".
//   3. Take the first 6 words; cap each word at 32 chars (with ellipsis).
//   4. Cap the overall length at 60 chars.

const FALLBACK = 'New Chat';
const MAX_WORDS = 6;
const MAX_WORD_LEN = 32;
const MAX_TOTAL_LEN = 60;

export function deriveTitle(text: string): string {
  if (!text || !text.trim()) return FALLBACK;

  // Strip Unicode punctuation (\p{P}) and symbols that masquerade as
  // separators. The `u` flag is required for the property escape; supported
  // in every Chromium-based Electron renderer (and Node 20+).
  const stripped = text
    .normalize('NFKC')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return FALLBACK;

  const words = stripped.split(' ').slice(0, MAX_WORDS).map((w) => {
    if (w.length <= MAX_WORD_LEN) return w;
    return `${w.slice(0, MAX_WORD_LEN - 1)}…`;
  });
  const joined = words.join(' ').slice(0, MAX_TOTAL_LEN);

  // Defense in depth: if every word was filtered out, fall back. Otherwise
  // a future regex tweak that over-strips wouldn't immediately surface as a
  // blank title in the sidebar.
  return joined.trim() || FALLBACK;
}
