import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectOnboardingMode } from '@features/onboarding';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  modelPickerOpenRequested,
  rightPanelToggled,
  secondarySidebarToggled,
} from '../store/slice';

/**
 * UX-SHELL-008 — global keyboard shortcuts mounted at the shell layer.
 *
 * Bindings:
 *   ⌘L  open model picker
 *   ⌘\  toggle secondary sidebar
 *   ⌘.  toggle right panel
 *   ⌘,  open Settings (ZL Universe parity)
 *
 * The handler ignores events whose target is an editable element (text
 * input / textarea / contenteditable) so the user can keep typing in the
 * model picker filter field, the chat composer, etc. without losing
 * keystrokes to a global handler.
 *
 * Cross-platform: macOS uses Cmd (metaKey), Windows/Linux uses Ctrl
 * (ctrlKey). The Electron app ships on macOS today but checking both
 * keeps the bindings working in dev on any platform.
 */
export function useGlobalShortcuts(): void {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mode = useAppSelector(selectOnboardingMode);

  useEffect(() => {
    function isEditableTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (t.isContentEditable) return true;
      return false;
    }

    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      // Don't swallow native shortcuts when modifier-shifted in unexpected ways.
      if (e.altKey) return;

      // Suppress when typing — except for ⌘L, which we explicitly want to
      // open the picker even from inside the picker filter (re-open / focus).
      const editing = isEditableTarget(e.target);

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        dispatch(modelPickerOpenRequested());
        return;
      }
      // ⌘, to open Settings — fires even from inside an editable target
      // (mirroring native macOS behaviour where Cmd+, is reserved for
      // app preferences and should never be hijacked by a text field).
      if (e.key === ',') {
        e.preventDefault();
        navigate('/settings');
        return;
      }
      if (editing) return;

      if (e.key === '\\') {
        e.preventDefault();
        dispatch(secondarySidebarToggled());
        return;
      }
      if (e.key === '.') {
        // Right panel is hidden in User mode — silently swallow the key
        // there so it doesn't toggle invisible state and confuse the user
        // into thinking the binding is broken.
        if (mode === 'user') return;
        e.preventDefault();
        dispatch(rightPanelToggled());
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch, navigate, mode]);
}
