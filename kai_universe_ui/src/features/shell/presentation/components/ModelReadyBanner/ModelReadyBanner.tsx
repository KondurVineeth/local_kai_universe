import { CheckCircle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@shared/ds/primitives';
import { useAppSelector } from '@shared/store/hooks';

import { useLoadedModel } from '../../hooks/useLoadedModel';
import { selectModelLoadStatus } from '../../store/selectors';

// UX-SHELL-002 — one-shot "ready" banner shown for 1.5s when the global
// model load lifecycle transitions `loading → loaded`. No Toast primitive
// exists in @shared/ds/primitives today, so this is a small inline
// bottom-right banner (auto-dismissing). Lives in the shell so it doesn't
// require touching any chat feature components (those are in cluster G).
const READY_BANNER_DURATION_MS = 1500;

export function ModelReadyBanner() {
  const status = useAppSelector(selectModelLoadStatus);
  const { model } = useLoadedModel();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const prevStatusRef = useRef(status);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === 'loading' && status === 'loaded') {
      setVisible(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), READY_BANNER_DURATION_MS);
    }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  if (!visible) return null;
  const label = model?.displayName ?? 'Model';
  // "Start chatting" is a real affordance now — clicking the banner routes
  // to /chat (which lands the user on the composer). Dismisses the banner
  // immediately so it doesn't linger after the user has acted.
  const goToChat = () => {
    setVisible(false);
    navigate('/chat');
  };
  return (
    <div
      role="status"
      aria-live="polite"
      // Top-right (not bottom-right) so the toast doesn't compete with the
      // chat input dock for the user's eye. Offset clears the 40px title
      // bar plus a small breathing gap.
      className="pointer-events-none fixed right-4 top-14 z-50 animate-fade-up"
    >
      <button
        type="button"
        onClick={goToChat}
        className="pointer-events-auto flex items-center gap-2 rounded-md border border-success bg-bg-raised px-3 py-2 text-xs text-fg-default shadow-md transition-colors hover:bg-bg-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Icon icon={CheckCircle} size="sm" className="text-success" />
        <span>
          <span className="font-medium">{label}</span> ready — start chatting →
        </span>
      </button>
    </div>
  );
}
