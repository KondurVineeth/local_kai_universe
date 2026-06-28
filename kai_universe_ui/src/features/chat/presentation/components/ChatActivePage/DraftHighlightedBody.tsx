import { useMemo, useRef } from 'react';

interface DraftHighlightedBodyProps {
  readonly content: string;
  readonly streaming: boolean;
}

// Mock visualization of "tokens accepted from the draft model". The real
// backend would emit a per-token accepted/rejected flag during speculative
// decoding; we don't have that, so we deterministically mark every other
// whitespace-delimited token as "accepted" via a faint accent background.
//
// BUG-CHAT-RENDER-010: the parity used to be computed from `split(/\s+/)`
// applied to the WHOLE accumulated content on every render. As new tokens
// arrived mid-stream, the parity index of an existing token could flip
// retroactively (e.g. a chunk arriving with a leading-whitespace boundary
// adds a phantom empty string at index 0), causing previously-green tokens
// to flicker between accepted/rejected. The fix: use a stable ref that
// remembers each non-whitespace token's accepted/rejected fate the first
// time we see it at a given position, so the visualization is monotonic.
//
// CJK note: the parity is over a `split(/(\s+)/)` segmentation. CJK text
// without whitespace becomes one giant token and conveys nothing, so when
// no whitespace boundary exists in the content we suppress the visualization
// and fall back to plain rendering — better than a single block of solid
// color.
export function DraftHighlightedBody({ content, streaming }: DraftHighlightedBodyProps) {
  // Stable parity per token-index. Index → boolean (accepted). Reset on
  // content shrinking (e.g. regenerate); growing keeps prior assignments.
  const acceptedByIndexRef = useRef<boolean[]>([]);

  const tokens = useMemo(() => content.split(/(\s+)/).filter((s) => s.length > 0), [content]);

  // Suppress visualization for content that has no whitespace boundary at
  // all (CJK, single-token URLs, etc.). Plain pre-wrap is the better look.
  const hasWhitespaceBoundary = /\s/.test(content);

  // Build a render-time list of {tok, accepted}. Walk in order; for each
  // non-whitespace token, look up its assignment in the ref; if it's a fresh
  // index, write the parity now and keep it for future renders.
  const acceptedRecord = acceptedByIndexRef.current;
  // Reset assignments if content shrank past prior recorded length.
  if (acceptedRecord.length > tokens.length) {
    acceptedRecord.length = tokens.length;
  }

  let nonSpaceIndex = 0;
  return (
    <div className="prose-chat whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
      {tokens.map((tok, i) => {
        const isWhitespace = /^\s+$/.test(tok);
        if (isWhitespace) return tok;
        if (!hasWhitespaceBoundary) {
          nonSpaceIndex += 1;
          return <span key={i}>{tok}</span>;
        }
        let accepted = acceptedRecord[i];
        if (accepted === undefined) {
          accepted = nonSpaceIndex % 2 === 0;
          acceptedRecord[i] = accepted;
        }
        nonSpaceIndex += 1;
        return (
          <span
            key={i}
            className={accepted ? 'rounded-sm bg-accent/20 px-0.5' : undefined}
          >
            {tok}
          </span>
        );
      })}
      {streaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-fg-default align-middle"
        />
      )}
    </div>
  );
}
