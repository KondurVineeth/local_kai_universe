import { useEffect, useRef, type RefObject, type KeyboardEvent } from 'react';

// Shared modal keyboard helpers used by SystemPromptEditorModal +
// InstallPluginDialog. CONFIG-027 calls for Esc handling + focus trap on
// both. Living in a feature-local hook keeps each modal component under
// the lint's max-lines-per-function ceiling.

// Calls `onEscape` whenever the user presses Escape, regardless of which
// element inside the modal has focus. Mounts a window-level listener so
// elements outside the dialog div (rare but possible) still trigger.
export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape]);
}

// Returns a Tab/Shift+Tab cycle handler bound to the dialog's root ref.
// Pulls the focusable nodes lazily (handler runs on each Tab press) so a
// late-mounted child (e.g. a conditional error message) is included.
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap<T extends HTMLElement>(): {
  ref: RefObject<T>;
  onKeyDown: (e: KeyboardEvent<T>) => void;
} {
  const ref = useRef<T | null>(null);
  const onKeyDown = (e: KeyboardEvent<T>) => {
    if (e.key !== 'Tab') return;
    const root = ref.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first?.focus();
    }
  };
  return { ref, onKeyDown };
}
