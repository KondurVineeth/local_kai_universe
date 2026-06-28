import { Plus, Question } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Icon, Textarea } from '@shared/ds/primitives';
import { formatRelativeTime } from '@shared/lib/relativeTime';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectNoteForThread,
  selectNoteUpdatedAt,
  selectSelectedThreadId,
} from '../../store/selectors';
import { setThreadNote } from '../../store/slice';

import { PanelSection } from './PanelSection';

const SUMMARY_TRUNCATE_AT = 40;

// "+ Add a note" empty state matches ZL Universe. Once the user starts typing,
// the textarea takes over the section body. Note value is per-thread.
export function NotesPanel() {
  const threadId = useAppSelector(selectSelectedThreadId);
  const note = useAppSelector(selectNoteForThread(threadId));
  const updatedAt = useAppSelector(selectNoteUpdatedAt(threadId));
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  // Re-render the relative-time label every 30s so "1 min ago" actually
  // ticks while the panel is open. No subscriptions needed past the slice
  // — this is purely a presentational refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!updatedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [updatedAt]);

  // CONFIG-017: reset the `editing` flag whenever the user navigates to a
  // different chat. Otherwise the previous chat's "I'm editing" state leaks
  // into the new chat's NotesPanel render and the textarea autofocuses on
  // a chat the user just opened — which can hijack their typing flow.
  useEffect(() => {
    setEditing(false);
  }, [threadId]);

  // CONFIG-018: only append the ellipsis when we actually truncated. The
  // previous unconditional "…" looked like every note had more text than
  // displayed, even for 5-char notes.
  const trimmedNote = note.trim();
  const summary =
    trimmedNote.length === 0
      ? 'Add notes…'
      : trimmedNote.length > SUMMARY_TRUNCATE_AT
        ? `${trimmedNote.slice(0, SUMMARY_TRUNCATE_AT)}…`
        : trimmedNote;

  const titleSlot = (
    <span className="inline-flex items-center gap-1">
      <span>Conversation Notes</span>
      <Icon icon={Question} size="xs" className="text-fg-subtle" />
    </span>
  );

  if (!threadId) {
    return (
      <PanelSection panelKey="notes" title={titleSlot} summary="No chat selected">
        <p className="text-caption text-fg-subtle">Select a chat to add notes.</p>
      </PanelSection>
    );
  }

  const showEditor = editing || note.length > 0;
  return (
    <PanelSection panelKey="notes" title={titleSlot} summary={summary}>
      {showEditor ? (
        <div className="flex flex-col gap-1">
          <Textarea
            rows={5}
            autoFocus={editing}
            value={note}
            onChange={(e) => dispatch(setThreadNote({ threadId, note: e.target.value }))}
            onBlur={() => setEditing(false)}
            placeholder="Anything to remember about this chat — topic, source links, next steps."
            aria-label="Conversation notes"
          />
          {updatedAt && (
            <span className="text-caption text-fg-subtle">
              Saved · {formatRelativeTime(updatedAt)}
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border-default py-2 text-micro text-fg-muted hover:border-border-strong hover:text-fg-default"
        >
          <Icon icon={Plus} size="xs" />
          <span>Add a note</span>
        </button>
      )}
    </PanelSection>
  );
}
