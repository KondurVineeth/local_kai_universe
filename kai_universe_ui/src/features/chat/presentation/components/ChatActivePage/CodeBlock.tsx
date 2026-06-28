import { Check, Copy } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { Icon } from '@shared/ds/primitives';

interface CodeBlockProps {
  readonly language: string;
  readonly highlightedHtml: string;
  // BUG-CHAT-RENDER-011: pass raw code as a prop instead of reading
  // `pre.textContent` — `textContent` raced the highlight rerender and the
  // first click after a chunk landed could copy the previous frame's content.
  readonly rawCode: string;
}

export function CodeBlock({ language, highlightedHtml, rawCode }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // BUG-CHAT-RENDER-011: clear pending timeout on unmount so the setState
  // doesn't fire against a torn-down component.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(rawCode)
      .then(() => {
        setCopied(true);
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, 2000);
      })
      .catch(() => {
        // Clipboard API can reject (perms, headless, secure-context). Silent
        // failure is fine for a UI mock — no-op leaves the button unchanged.
      });
  };

  return (
    // BUG-CHAT-RENDER-012: the copy button is absolutely positioned inside
    // the header, which anchors it to the header's top-right at every
    // container width. The header itself is `sticky top-0`: while any part
    // of the fence is in view it pins to the top of the scroll viewport so
    // the language label + Copy stay reachable; once the whole block scrolls
    // past, the header leaves with it (native sticky behavior).
    <div className="mb-3 rounded-lg border border-border-default bg-bg-surface">
      <div className="sticky top-0 z-10 flex h-10 items-center rounded-t-lg border-b border-border-default bg-bg-surface px-4">
        <span className="font-mono text-xs text-fg-subtle">{language || 'plain'}</span>

        {/* BUG-CHAT-RENDER-013: aria-live polite so the copied/idle state is
            announced; aria-label on the button itself for screen readers. */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-live="polite">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied code to clipboard' : 'Copy code to clipboard'}
            className="flex items-center gap-1.5 rounded-md border border-border-default bg-bg-raised px-2.5 py-1 text-xs text-fg-muted transition-colors hover:text-fg-default"
          >
            <Icon icon={copied ? Check : Copy} size="xs" weight={copied ? 'bold' : 'regular'} />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* BUG-CHAT-RENDER-013: tabIndex+role+aria-label expose the code block
          to keyboard users and screen readers. */}
      <pre
        tabIndex={0}
        role="region"
        aria-label={language ? `${language} code block` : 'code block'}
        className="m-0 rounded-b-lg bg-bg-surface px-4 py-4 text-xs leading-relaxed"
        style={{ whiteSpace: 'pre', overflowX: 'auto' }}
      >
        <code
          className={language ? `language-${language}` : undefined}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    </div>
  );
}

