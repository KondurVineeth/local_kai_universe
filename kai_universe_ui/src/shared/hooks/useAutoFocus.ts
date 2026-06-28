import { useCallback } from 'react';

type FocusableElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Returns a callback ref that focuses an input/textarea the moment it mounts
 * and positions the caret. React's `autoFocus` alone leaves the caret at
 * index 0 in Chromium — wrong for an edit affordance pre-filled with an
 * existing value, where the user means to amend or replace the text, not
 * insert at the start.
 *
 *   'end'    — caret after the last character (append/amend intent)
 *   'select' — whole value selected (replace intent, e.g. rename)
 *
 * A callback ref (not a mount effect) so it also fires for fields that are
 * conditionally rendered after their parent has already mounted — the common
 * inline-edit pattern. Attach the returned value as `ref` on the field.
 */
export function useAutoFocus<T extends FocusableElement = HTMLTextAreaElement>(
  caret: 'end' | 'select' = 'end',
) {
  return useCallback(
    (el: T | null) => {
      if (!el) return;
      el.focus();
      if (caret === 'select') {
        el.select();
      } else {
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }
    },
    [caret],
  );
}
