import { Fragment } from 'react';

// Wraps occurrences of `query` inside `text` in a <mark> for visual emphasis
// during sidebar search. Case-insensitive; preserves the source casing in
// the output. When `query` is empty/whitespace, renders the text verbatim.
//
// Designed for short labels (thread title, folder name); not for body text.
// The mark uses bg-accent/25 + text-fg-default so the highlight reads
// against both the row's idle bg-bg-raised/60 hover and the selected row's
// bg-bg-raised. Inline styling — no separate token needed for this one use.
export function HighlightText({
  text,
  query,
  className,
}: {
  readonly text: string;
  readonly query: string;
  readonly className?: string;
}) {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return <span className={className}>{text}</span>;
  }
  const segments = splitOnQuery(text, trimmed);
  return (
    <span className={className}>
      {segments.map((s, i) => (
        <Fragment key={i}>
          {s.match ? (
            <mark className="rounded-sm bg-accent/25 px-0.5 text-fg-default">{s.text}</mark>
          ) : (
            s.text
          )}
        </Fragment>
      ))}
    </span>
  );
}

interface Segment {
  readonly text: string;
  readonly match: boolean;
}

function splitOnQuery(text: string, query: string): readonly Segment[] {
  const out: Segment[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const next = lowerText.indexOf(lowerQuery, i);
    if (next === -1) {
      out.push({ text: text.slice(i), match: false });
      break;
    }
    if (next > i) out.push({ text: text.slice(i, next), match: false });
    out.push({ text: text.slice(next, next + query.length), match: true });
    i = next + query.length;
  }
  return out;
}
