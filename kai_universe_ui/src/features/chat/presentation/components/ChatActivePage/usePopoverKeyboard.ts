import { useEffect } from 'react';

// Shared keyboard + click-outside wiring for the composer's inline popovers
// (MentionPopover, SlashCommandPopover). Listens at the window's capture
// phase so arrow keys and Enter reach the popover before the textarea
// below moves the caret or tries to send.
export function usePopoverKeyboard<T>({
  containerRef,
  items,
  focusedIdx,
  setFocusedIdx,
  onPick,
  onClose,
}: {
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  readonly items: readonly T[];
  readonly focusedIdx: number;
  readonly setFocusedIdx: React.Dispatch<React.SetStateAction<number>>;
  readonly onPick: (item: T) => void;
  readonly onClose: () => void;
}): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (items.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx((i) => (i + 1) % items.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx((i) => (i - 1 + items.length) % items.length);
        return;
      }
      if (e.key === 'Enter') {
        const item = items[focusedIdx];
        if (item === undefined) return;
        e.preventDefault();
        // Stop the textarea's own Enter handler from firing.
        e.stopPropagation();
        onPick(item);
      }
    };
    const onPointer = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [containerRef, items, focusedIdx, setFocusedIdx, onPick, onClose]);
}
