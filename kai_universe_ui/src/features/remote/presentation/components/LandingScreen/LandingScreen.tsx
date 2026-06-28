import { Button, Spinner } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectAuthStatus } from '../../store/selectors';
import { learnModalOpened } from '../../store/slice';
import { cancelLoginThunk, mockLoginThunk } from '../../store/thunks';
import { RemoteMascot } from '../RemoteMascot';

export function LandingScreen() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const authenticating = authStatus === 'authenticating';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2xl px-xl">
      <div className="flex flex-col items-center gap-xl text-center" style={{ maxWidth: 560 }}>
        <PreviewBadge />
        <ConnectionIllustration />
        <div className="flex flex-col gap-m">
          <h1 className="text-2xl font-bold text-fg-default">Use your local models, remotely.</h1>
          <p className="text-sm text-fg-subtle">
            Introducing Remote Link. Load models on remote machines and use them as if they are
            local. End-to-end encrypted. Works for local devices, LLM rigs, or cloud VMs.
          </p>
        </div>
        <div className="flex flex-col items-center gap-m">
          <div className="flex gap-s">
            {authenticating ? (
              // Not a button — this is a non-interactive in-progress
              // indicator while the (mock) browser OAuth resolves. The
              // actionable affordance during this state is the "Retry"
              // link below; a dead Button here was a no-op trap.
              <span
                className="flex items-center gap-s rounded-md px-l py-m text-sm font-medium text-fg-muted"
                role="status"
                aria-live="polite"
              >
                <Spinner size="sm" />
                Complete sign-in in the browser...
              </span>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => dispatch(mockLoginThunk())}
              >
                Login &amp; Request Access
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => dispatch(learnModalOpened())}
            >
              Learn how it works
            </Button>
          </div>
          {authenticating && (
            <p className="text-xs text-fg-subtle">
              {"Didn't work? "}
              <button
                className="text-fg-accent hover:underline"
                onClick={() => dispatch(cancelLoginThunk())}
              >
                Retry
              </button>
            </p>
          )}
          <button
            className="text-xs text-fg-subtle hover:text-fg-muted hover:underline"
            onClick={() => dispatch(learnModalOpened())}
          >
            Why do I need to log in?
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-m">
        <RemoteMascot />
        <p className="text-xs text-fg-subtle">
          Remote Link is in Preview. We are rolling out access in batches.
        </p>
      </div>
    </div>
  );
}

function PreviewBadge() {
  return (
    <span
      className="rounded-full px-3 py-1 text-caption font-bold uppercase tracking-wider text-fg-default"
      style={{ backgroundColor: 'var(--color-accent-surface-low)' }}
    >
      Available in Preview
    </span>
  );
}

function ConnectionIllustration() {
  return (
    <svg viewBox="0 0 240 72" width="240" height="72" aria-hidden role="presentation" className="text-fg-subtle">
      <rect x="8" y="16" width="52" height="40" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="16" y="26" width="36" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="16" y="37" width="36" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="52" cy="50" r="2" fill="currentColor" />
      {[93, 106, 120, 134, 147].map((x) => (
        <circle key={x} cx={x} cy="36" r="3" fill="currentColor" opacity="0.5" />
      ))}
      <rect x="180" y="14" width="52" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="168" y1="50" x2="244" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M164 53 H248" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

