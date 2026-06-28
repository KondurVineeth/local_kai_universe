import { Warning } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { Button, Icon } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectMcpJsonContent } from '../../store/selectors';
import { mcpJsonContentSet, mcpJsonOpenSet } from '../../store/slice';

// Validate the editor draft as JSON. Empty input is allowed (treated as a
// no-op clear); anything else must parse, otherwise Save is blocked.
function validateJson(draft: string): string | null {
  if (draft.trim() === '') return null;
  try {
    JSON.parse(draft);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'Invalid JSON';
  }
}

export function McpJsonDialog() {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectMcpJsonContent);
  const [draft, setDraft] = useState(saved);

  // Recomputed on every keystroke so the error banner + Save disabled
  // state track the editor live.
  const error = useMemo(() => validateJson(draft), [draft]);

  function handleSave() {
    if (error) return;
    dispatch(mcpJsonContentSet(draft));
    dispatch(mcpJsonOpenSet(false));
  }

  function handleDiscard() {
    dispatch(mcpJsonOpenSet(false));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex w-[560px] flex-col overflow-hidden rounded-lg border border-border-default bg-bg-raised shadow-2xl">
        <div className="border-b border-border-default px-5 py-4">
          <h2 className="text-sm font-semibold text-fg-default">Edit mcp.json</h2>
          <p className="mt-0.5 text-xs text-fg-subtle">
            Saving this file will reload your MCP servers.
          </p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <LineNumbers content={draft} />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="flex-1 resize-none bg-bg-base px-3 py-3 font-mono text-xs text-fg-default outline-none"
            style={{ minHeight: 320 }}
            aria-label="mcp.json content"
            aria-invalid={error !== null}
            onKeyDown={(e) => {
              if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                handleDiscard();
              }
            }}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 border-t border-border-default bg-danger/10 px-5 py-2.5 text-xs text-danger"
          >
            <Icon icon={Warning} size="xs" weight="fill" className="mt-px shrink-0" />
            <span className="min-w-0 break-words">Invalid JSON — {error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border-default px-5 py-3">
          <Button variant="ghost" size="sm" onClick={handleDiscard}>
            Discard <span className="ml-1 text-fg-subtle">⌘Esc</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={error !== null}>
            Save <span className="ml-1 text-fg-default/60">⌘S</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LineNumbers({ content }: { readonly content: string }) {
  const lines = content.split('\n');
  return (
    <div className="select-none bg-bg-base py-3 pr-3 pl-4 text-right font-mono text-xs text-fg-subtle">
      {lines.map((_, i) => (
        <div key={i} className="leading-5">{i + 1}</div>
      ))}
    </div>
  );
}
