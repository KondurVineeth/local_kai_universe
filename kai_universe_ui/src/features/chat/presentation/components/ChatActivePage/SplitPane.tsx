import { ArrowsLeftRight, ColumnsPlusRight, X } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector, useAppStore } from '@shared/store/hooks';

import {
  selectActiveFolderId,
  selectMessagesForThread,
  selectModelGate,
  selectSelectedThreadId,
  selectThreads,
} from '../../store/selectors';
import { setSplitThread, swapSplit } from '../../store/slice';
import { createThreadThunk, openModelPickerThunk } from '../../store/thunks';

import { MessageFeed } from './MessageFeed';

import type { FolderId } from '../../../domain/entities/Folder';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

interface SplitPaneProps {
  readonly threadId: ThreadId;
}

export function SplitPane({ threadId }: SplitPaneProps) {
  const threads = useAppSelector(selectThreads);
  const messages = useAppSelector(selectMessagesForThread(threadId));
  const selectedId = useAppSelector(selectSelectedThreadId);
  const activeFolderId = useAppSelector(selectActiveFolderId);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const store = useAppStore();
  const current = threads.find((t) => t.id === threadId);

  // Disallow swap when both panes resolve to the same id (or one is missing)
  // — swapping a thread with itself is a no-op visually but still triggers a
  // navigate and re-render, which surfaces stale-id artifacts under StrictMode.
  const canSwap = !!selectedId && !!threadId && selectedId !== threadId;

  const onSwap = () => {
    if (!canSwap) return;
    dispatch(swapSplit());
    // Read the post-swap selected id straight from the store rather than
    // trusting the prop — under StrictMode the prop can lag the dispatch by
    // one render and we'd navigate to the wrong thread (BUG-CHAT-SPLIT-005).
    const nextSelected = selectSelectedThreadId(store.getState());
    if (nextSelected) navigate(`/chat/${nextSelected}`);
  };

  // Filter the option list to threads that aren't the main pane — comparing a
  // thread to itself is a UX dead-end and the slice now rejects it anyway, so
  // surfacing it in the dropdown only invites confusion (BUG-CHAT-SPLIT-004).
  const optionThreads = threads.filter((t) => t.id !== selectedId);
  const valueInOptions = optionThreads.some((t) => t.id === threadId);

  // BUG-CHAT-SPLIT-018: when the only thread is the one already shown in the
  // main pane, the compared-chat dropdown is empty and the split pane strands
  // the user with nothing to pick. Surface a dedicated empty state with a
  // single CTA to create another chat to compare.
  if (optionThreads.length === 0) {
    return <SplitPaneEmpty activeFolderId={activeFolderId} />;
  }

  return (
    <div className="grid h-full grid-rows-[40px_1fr] border-l border-border-default">
      <div className="flex h-10 items-center justify-between gap-2 border-b border-border-default bg-bg-base px-4">
        <select
          aria-label="Compared chat"
          value={threadId}
          onChange={(e) => dispatch(setSplitThread(e.target.value as ThreadId))}
          className="min-w-0 flex-1 truncate rounded-md bg-transparent text-sm font-medium text-fg-default focus:outline-none"
        >
          {/* If the current value isn't in the option list (deleted thread,
              or now-equal-to-main), render an explicit disabled placeholder
              so React doesn't warn about an out-of-range controlled value
              (BUG-CHAT-SPLIT-017). */}
          {!valueInOptions && (
            <option value={threadId} disabled>
              {current ? current.title : '(thread not found)'}
            </option>
          )}
          {optionThreads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <Tooltip content="Swap with main" side="bottom">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Swap split with main"
              onClick={onSwap}
              disabled={!canSwap}
            >
              <Icon icon={ArrowsLeftRight} size="sm" />
            </Button>
          </Tooltip>
          <Tooltip content="Close split" side="bottom">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Close split view"
              onClick={() => dispatch(setSplitThread(null))}
            >
              <Icon icon={X} size="sm" />
            </Button>
          </Tooltip>
        </div>
      </div>
      {current ? (
        <MessageFeed messages={messages} isStreaming={false} threadId={threadId} readonly />
      ) : (
        <div className="flex items-center justify-center text-xs text-fg-subtle">
          Chat not found
        </div>
      )}
    </div>
  );
}

// Shown when no second thread exists to compare against. Answers the two
// empty-state questions (why empty / what's the one click) per the UX rules.
function SplitPaneEmpty({ activeFolderId }: { readonly activeFolderId: FolderId | null }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { ready } = useAppSelector(selectModelGate);

  const onCreate = () => {
    if (!ready) {
      dispatch(openModelPickerThunk());
      return;
    }
    const id = dispatch(createThreadThunk({ folderId: activeFolderId }));
    if (id) navigate(`/chat/${id}`);
  };

  return (
    <div className="grid h-full grid-rows-[40px_1fr] border-l border-border-default">
      <div className="flex h-10 items-center justify-between gap-2 border-b border-border-default bg-bg-base px-4">
        <span className="truncate text-sm font-medium text-fg-subtle">Compare</span>
        <Tooltip content="Close split" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close split view"
            onClick={() => dispatch(setSplitThread(null))}
          >
            <Icon icon={X} size="sm" />
          </Button>
        </Tooltip>
      </div>
      <div className="flex flex-col items-center justify-center gap-3xl px-xl text-center">
        <Icon icon={ColumnsPlusRight} size="xl" className="text-fg-subtle" />
        <div className="flex max-w-xs flex-col items-center gap-m">
          <h2 className="text-base font-semibold text-fg-default">
            Nothing to compare yet
          </h2>
          <p className="text-xs text-fg-muted">
            Split view shows two chats side by side. Create another chat to
            compare it against this one.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onCreate}>
          {ready ? 'Create another chat' : 'Load a model'}
        </Button>
      </div>
    </div>
  );
}
