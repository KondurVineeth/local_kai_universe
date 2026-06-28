import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectModelGate } from '../../store/selectors';
import { createThreadThunk, openModelPickerThunk } from '../../store/thunks';

// /chat index. When a model is loaded, this lands on the New Chat composer
// view (matching what "+ New chat" produces) — createThreadThunk de-dupes,
// so repeated index visits don't spam new threads.
//
// When NO model is loaded it must NOT auto-create a thread: an empty thread
// with no model is unusable, adds sidebar noise, and the Back button has
// nothing to return to (UX-CHAT-002 — the sidebar's "+ New chat" already
// gates on this). Instead it prompts the user to load a model; once one is
// loaded the effect re-runs and proceeds into a fresh thread automatically.
export function ChatIndexRedirect() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { ready, transient } = useAppSelector(selectModelGate);

  useEffect(() => {
    if (!ready) return;
    const id = dispatch(createThreadThunk());
    if (id) navigate(`/chat/${id}`, { replace: true });
  }, [dispatch, navigate, ready]);

  if (ready) return null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-m px-l text-center">
      <h2 className="text-lg font-semibold text-fg-default">Load a model to start chatting</h2>
      <p className="max-w-sm text-sm text-fg-muted">
        Pick a model from the top bar — once it&apos;s loaded, a new chat opens automatically.
      </p>
      <Button
        variant="primary"
        size="md"
        disabled={transient}
        onClick={() => void dispatch(openModelPickerThunk())}
      >
        {transient ? 'Loading model…' : 'Choose a model'}
      </Button>
    </div>
  );
}
